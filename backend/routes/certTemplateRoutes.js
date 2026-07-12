const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const CertTemplate = require('../models/CertTemplate');
const Member = require('../models/Member');
const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/adminMiddlewares');
const { detectZones, mergeZonesWithDefaults } = require('../utils/certZoneDetector');
const { createUpload, getFileUrl, deleteFile } = require('../utils/storage');

const upload = createUpload('cert-templates', 15 * 1024 * 1024);

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadMiddleware = (req, res, next) => {
  upload.single('template')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image must be under 15MB' });
      }
      return res.status(400).json({ error: err.message || 'Only PNG and JPEG accepted' });
    }
    next();
  });
};

function streamRemoteUrl(url, res) {
  const client = url.startsWith('https') ? https : http;
  client
    .get(url, (upstream) => {
      if (upstream.statusCode && upstream.statusCode >= 400) {
        res.status(upstream.statusCode).json({ error: 'Template image unavailable.' });
        upstream.resume();
        return;
      }
      res.setHeader('Content-Type', upstream.headers['content-type'] || 'image/png');
      res.setHeader('Cache-Control', 'private, max-age=300');
      upstream.pipe(res);
    })
    .on('error', (err) => {
      console.error('Template image proxy error:', err.message);
      if (!res.headersSent) res.status(502).json({ error: 'Failed to load template image.' });
    });
}

async function streamTemplateFile(doc, res) {
  const fileUrl = doc.fileUrl || '';

  if (fileUrl.includes('.amazonaws.com') && process.env.AWS_S3_BUCKET_NAME) {
    try {
      const key = fileUrl.split('.amazonaws.com/')[1];
      if (!key) throw new Error('Invalid S3 key');
      const out = await s3.send(new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
      }));
      res.setHeader('Content-Type', out.ContentType || 'image/png');
      res.setHeader('Cache-Control', 'private, max-age=300');
      if (out.Body && typeof out.Body.pipe === 'function') {
        out.Body.pipe(res);
      } else {
        const bytes = await out.Body.transformToByteArray();
        res.send(Buffer.from(bytes));
      }
      return;
    } catch (err) {
      console.error('S3 GetObject failed, falling back to URL stream:', err.message);
      return streamRemoteUrl(fileUrl, res);
    }
  }

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return streamRemoteUrl(fileUrl, res);
  }

  const relativePath = String(fileUrl).replace(/^\//, '');
  const fullPath = path.join(__dirname, '..', relativePath);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Template image file missing on server.' });
  }
  return res.sendFile(fullPath);
}

// POST /api/cert-templates/upload
router.post('/upload', authMiddleware, isAdmin, uploadMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No template file uploaded.' });
    }

    const fileUrl = getFileUrl(req.file, 'cert-templates');
    const zones = detectZones(2048, 1436);
    const doc = await CertTemplate.create({
      name: req.body.name || 'Untitled',
      fileUrl,
      zones,
      uploadedBy: req.user.memberId || req.user.id,
    });

    return res.status(201).json({
      templateId: doc._id,
      _id: doc._id,
      name: doc.name,
      fileUrl: doc.fileUrl,
      imageUrl: `/api/cert-templates/${doc._id}/image`,
      zones: doc.zones,
      isActive: doc.isActive,
      calibrated: doc.calibrated,
      uploadedAt: doc.uploadedAt,
      canvasWidth: doc.canvasWidth,
      canvasHeight: doc.canvasHeight,
      previewUrl: fileUrl,
    });
  } catch (error) {
    console.error('Cert template upload error:', error);
    res.status(500).json({ error: 'Failed to upload certificate template.' });
  }
});

// GET /api/cert-templates — admin list
router.get('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const templates = await CertTemplate.find()
      .sort({ isActive: -1, uploadedAt: -1 })
      .select('name fileUrl isActive calibrated uploadedAt');
    return res.json(templates);
  } catch (error) {
    console.error('Cert template list error:', error);
    res.status(500).json({ error: 'Failed to load templates.' });
  }
});

// GET /api/cert-templates/active-config — member download config
router.get('/active-config', authMiddleware, async (req, res) => {
  try {
    const member = await Member.findById(req.user.memberId || req.user.id)
      .select('name member_id approvedAt city status updatedAt whatsapp joining_year role');
    if (!member || member.status !== 'approved') {
      return res.status(403).json({ error: 'Certificate not available. Membership not approved.' });
    }

    const template = await CertTemplate.findOne({ isActive: true });
    if (!template) {
      return res.status(404).json({ error: 'No active certificate template. Contact admin.' });
    }

    const membershipStatus =
      member.role === 'Executive' || member.role === 'Admin' || member.role === 'Superuser'
        ? 'Active Member'
        : 'General Member';

    return res.json({
      template: {
        _id: template._id,
        fileUrl: `/api/cert-templates/${template._id}/image`,
        zones: mergeZonesWithDefaults(template.zones, template.canvasWidth, template.canvasHeight),
        canvasWidth: template.canvasWidth,
        canvasHeight: template.canvasHeight,
        name: template.name,
      },
      member: {
        name: member.name,
        memberId: member.member_id,
        approvedAt: member.approvedAt || member.updatedAt,
        city: member.city,
        mobile: member.whatsapp || '',
        joiningYear: member.joining_year || '',
        membershipStatus,
      },
    });
  } catch (error) {
    console.error('Cert active-config error:', error);
    res.status(500).json({ error: 'Failed to load certificate config.' });
  }
});

// GET /api/cert-templates/:id/image — CORS-safe proxy for canvas
router.get('/:id/image', authMiddleware, async (req, res) => {
  try {
    const doc = await CertTemplate.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Template not found.' });

    const isAdminUser = req.user && (req.user.role === 'Admin' || req.user.role === 'Superuser');
    if (!isAdminUser && !doc.isActive) {
      return res.status(403).json({ error: 'Template image not available.' });
    }

    return streamTemplateFile(doc, res);
  } catch (error) {
    console.error('Cert template image error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to load template image.' });
  }
});

// GET /api/cert-templates/:id
router.get('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const doc = await CertTemplate.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Template not found.' });
    const obj = doc.toObject();
    obj.imageUrl = `/api/cert-templates/${doc._id}/image`;
    obj.zones = mergeZonesWithDefaults(obj.zones, obj.canvasWidth, obj.canvasHeight);
    return res.json(obj);
  } catch (error) {
    console.error('Cert template get error:', error);
    res.status(500).json({ error: 'Failed to load template.' });
  }
});

// PUT /api/cert-templates/:id/activate
router.put('/:id/activate', authMiddleware, isAdmin, async (req, res) => {
  try {
    await CertTemplate.updateMany({}, { isActive: false });
    const doc = await CertTemplate.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!doc) return res.status(404).json({ error: 'Template not found.' });
    return res.json({ message: 'Template activated' });
  } catch (error) {
    console.error('Cert template activate error:', error);
    res.status(500).json({ error: 'Failed to activate template.' });
  }
});

// PUT /api/cert-templates/:id/zones
router.put('/:id/zones', authMiddleware, isAdmin, async (req, res) => {
  try {
    if (!req.body.zones) {
      return res.status(400).json({ error: 'zones payload is required.' });
    }
    const doc = await CertTemplate.findByIdAndUpdate(
      req.params.id,
      { zones: req.body.zones, calibrated: true },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Template not found.' });
    return res.json(doc);
  } catch (error) {
    console.error('Cert template zones error:', error);
    res.status(500).json({ error: 'Failed to save zones.' });
  }
});

// DELETE /api/cert-templates/:id
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const doc = await CertTemplate.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Template not found.' });
    if (doc.isActive) {
      return res.status(400).json({ error: 'Deactivate this template before deleting.' });
    }

    await deleteFile(doc.fileUrl);
    await CertTemplate.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Cert template delete error:', error);
    res.status(500).json({ error: 'Failed to delete template.' });
  }
});

module.exports = router;
