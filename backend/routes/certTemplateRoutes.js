const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const CertTemplate = require('../models/CertTemplate');
const Member = require('../models/Member');
const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/adminMiddlewares');
const { detectZones } = require('../utils/certZoneDetector');

const uploadDir = path.join(__dirname, '..', 'uploads', 'cert-templates');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${Date.now()}-${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only PNG and JPEG accepted'));
    }
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

// POST /api/cert-templates/upload
router.post('/upload', authMiddleware, isAdmin, uploadMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No template file uploaded.' });
    }

    const fileUrl = `/uploads/cert-templates/${req.file.filename}`;
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
      .select('name member_id approvedAt city status updatedAt');
    if (!member || member.status !== 'approved') {
      return res.status(403).json({ error: 'Certificate not available. Membership not approved.' });
    }

    const template = await CertTemplate.findOne({ isActive: true });
    if (!template) {
      return res.status(404).json({ error: 'No active certificate template. Contact admin.' });
    }

    return res.json({
      template: {
        fileUrl: template.fileUrl,
        zones: template.zones,
        canvasWidth: template.canvasWidth,
        canvasHeight: template.canvasHeight,
        name: template.name,
      },
      member: {
        name: member.name,
        memberId: member.member_id,
        approvedAt: member.approvedAt || member.updatedAt,
        city: member.city,
      },
    });
  } catch (error) {
    console.error('Cert active-config error:', error);
    res.status(500).json({ error: 'Failed to load certificate config.' });
  }
});

// GET /api/cert-templates/:id
router.get('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const doc = await CertTemplate.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Template not found.' });
    return res.json(doc);
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

    const relativePath = String(doc.fileUrl || '').replace(/^\//, '');
    const fullPath = path.join(__dirname, '..', relativePath);
    if (relativePath.startsWith('uploads' + path.sep) || relativePath.startsWith('uploads/')) {
      try {
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch (unlinkErr) {
        console.error('Cert template file unlink error:', unlinkErr);
      }
    }

    await CertTemplate.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Cert template delete error:', error);
    res.status(500).json({ error: 'Failed to delete template.' });
  }
});

module.exports = router;
