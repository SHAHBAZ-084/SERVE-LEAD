const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Certificate = require('../models/Certificate');
const Member = require('../models/Member');
const Event = require('../models/Event');
const CertTemplate = require('../models/CertTemplate');
const authMiddleware = require('../middlewares/authMiddleware');
const { mergeZonesWithDefaults } = require('../utils/certZoneDetector');

const isAdmin = async (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Superuser')) {
    try {
      const user = await Member.findById(req.user.memberId);
      if (!user || user.status === 'blocked') {
        return res.status(403).json({ error: 'Access denied. Account is blocked by super admin.' });
      }
      next();
    } catch (e) {
      res.status(500).json({ error: 'Authorization error' });
    }
  } else {
    res.status(403).json({ error: 'Access denied. Admin only.' });
  }
};

async function resolveIssueTemplate(certTemplateId) {
  if (certTemplateId && mongoose.Types.ObjectId.isValid(certTemplateId)) {
    const t = await CertTemplate.findById(certTemplateId);
    if (t && t.kind !== 'membership') return t;
  }
  return CertTemplate.findOne({ isActive: true, kind: 'general' });
}

function buildMemberRenderPayload(member) {
  const membershipStatus =
    member.role === 'Executive' || member.role === 'Admin' || member.role === 'Superuser'
      ? 'Executive Member'
      : 'General Member';
  return {
    name: member.name,
    memberId: member.member_id,
    approvedAt: member.approvedAt || member.updatedAt || member.createdAt,
    city: member.city,
    mobile: member.whatsapp || member.phone || '',
    joiningYear: member.joining_year || '2025',
    membershipStatus,
  };
}

function buildTemplatePayload(template) {
  return {
    _id: template._id,
    fileUrl: `/api/cert-templates/${template._id}/image`,
    zones: mergeZonesWithDefaults(
      template.zones,
      template.canvasWidth,
      template.canvasHeight,
      template.calibrated
    ),
    canvasWidth: template.canvasWidth,
    canvasHeight: template.canvasHeight,
    name: template.name,
  };
}

// POST /api/certificates - Issue a new certificate (Admin only)
router.post('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const {
      memberId,
      eventId,
      category,
      customCategory,
      description,
      chairmanName,
      title,
      awardType,
      templateId,
      certTemplateId,
    } = req.body;

    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required.' });
    }

    const member = await Member.findOne({ _id: memberId });
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    let validEventId = null;
    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ error: 'Event not found.' });
      validEventId = event._id;
    }

    const validCategories = ['Appreciation', 'Achievement', 'Participation', 'Excellence', 'Other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category selected.' });
    }
    if (category === 'Other' && (!customCategory || customCategory.trim() === '')) {
      return res.status(400).json({ error: 'Custom category name is required.' });
    }
    if (!chairmanName) {
      return res.status(400).json({ error: 'Chairman name is required to sign the certificate.' });
    }
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Certificate name is required.' });
    }

    const uploadedTemplate = await resolveIssueTemplate(certTemplateId);
    if (!uploadedTemplate) {
      return res.status(400).json({
        error: 'Activate an Issue template first (not Membership), then issue.',
      });
    }

    const newCert = new Certificate({
      memberId: member._id,
      memberName: member.name,
      member_id_str: member.member_id,
      eventId: validEventId,
      category,
      customCategory: category === 'Other' ? (customCategory || 'Unspecified') : undefined,
      description,
      chairmanName,
      title: String(title).trim(),
      awardType: awardType || 'Official Recognition',
      issuedBy: req.user.memberId,
      certTemplateId: uploadedTemplate._id,
      templateId: templateId || 1,
    });

    await newCert.save();
    res.status(201).json({ message: 'Certificate issued successfully.', certificate: newCert });
  } catch (error) {
    console.error('CRITICAL: Issue Certificate Error:', error.message, error.stack);
    res.status(500).json({ error: 'An unexpected error occurred while issuing the certificate.' });
  }
});

// POST /api/certificates/bulk
router.post('/bulk', authMiddleware, isAdmin, async (req, res) => {
  try {
    const {
      memberIds,
      eventId,
      category,
      customCategory,
      description,
      chairmanName,
      title,
      awardType,
      templateId,
      certTemplateId,
    } = req.body;

    const validCategories = ['Appreciation', 'Achievement', 'Participation', 'Excellence', 'Other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category selected.' });
    }
    if (category === 'Other' && (!customCategory || customCategory.trim() === '')) {
      return res.status(400).json({ error: 'Custom category name is required.' });
    }
    if (!chairmanName) {
      return res.status(400).json({ error: 'Chairman name is required to sign the certificate.' });
    }
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Certificate name is required.' });
    }

    const uploadedTemplate = await resolveIssueTemplate(certTemplateId);
    if (!uploadedTemplate) {
      return res.status(400).json({
        error: 'Activate an Issue template first (not Membership), then issue.',
      });
    }

    let targetMembers = [];
    let validEventId = null;

    if (Array.isArray(memberIds) && memberIds.length > 0) {
      targetMembers = await Member.find({
        _id: { $in: memberIds },
        status: 'approved',
        role: { $nin: ['Admin', 'Superuser'] },
      }).select('_id name member_id');
      if (targetMembers.length === 0) {
        return res.status(400).json({ error: 'No valid approved members selected.' });
      }
      if (eventId) {
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ error: 'Event not found.' });
        validEventId = event._id;
      }
    } else if (eventId) {
      const event = await Event.findById(eventId).populate('participants.memberId');
      if (!event) return res.status(404).json({ error: 'Event not found.' });
      validEventId = event._id;
      targetMembers = (event.participants || [])
        .filter((p) => p.attended === true && p.memberId)
        .map((p) => p.memberId);
      if (targetMembers.length === 0) {
        return res.status(400).json({
          error: 'No members selected. Pick members, or mark event attendees as Present first.',
        });
      }
    } else {
      return res.status(400).json({ error: 'Select at least one member (or an event) for bulk issue.' });
    }

    const certificates = [];
    for (const member of targetMembers) {
      const mid = member._id || member;
      if (validEventId) {
        const existing = await Certificate.findOne({ memberId: mid, eventId: validEventId });
        if (existing) continue;
      }
      certificates.push({
        memberId: mid,
        memberName: member.name,
        member_id_str: member.member_id,
        eventId: validEventId,
        category,
        customCategory: category === 'Other' ? customCategory : undefined,
        title: String(title).trim(),
        awardType: awardType || 'Official Recognition',
        description,
        chairmanName,
        issuedBy: req.user.memberId,
        certTemplateId: uploadedTemplate._id,
        templateId: templateId || 1,
      });
    }

    if (certificates.length === 0) {
      return res.status(400).json({ error: 'No new certificates to issue (duplicates skipped).' });
    }

    await Certificate.insertMany(certificates);
    res.status(201).json({
      message: `Successfully issued ${certificates.length} certificates.`,
      count: certificates.length,
    });
  } catch (error) {
    console.error('CRITICAL: Bulk Issue Certificate Error:', error.message, error.stack);
    res.status(500).json({ error: 'An unexpected error occurred during bulk issuance.' });
  }
});

// GET /api/certificates/member/me — only certificates admin issued (no auto-create)
router.get('/member/me', authMiddleware, async (req, res) => {
  try {
    let queryMemberId = req.user.memberId;
    const query = {};
    if (mongoose.Types.ObjectId.isValid(queryMemberId)) {
      query.memberId = queryMemberId;
      const member = await Member.findById(queryMemberId).select('name member_id status');
      if (member) {
        const { ensureMembershipCertificate } = require('../utils/membershipCertificate');
        await ensureMembershipCertificate(member).catch((err) => {
          console.error('Backfill membership certificate failed:', err.message);
        });
      }
    } else {
      query.member_id_str = queryMemberId;
    }

    const certificates = await Certificate.find(query)
      .populate('eventId', 'title date location')
      .populate('memberId', 'name member_id role joining_year status')
      .populate('certTemplateId', 'name isActive')
      .sort({ createdAt: -1 })
      .lean();

    const mappedCertificates = certificates.map((c) => ({
      ...c,
      _id: c._id?.toString(),
      eventId: c.eventId ? { ...c.eventId, _id: c.eventId._id?.toString() } : null,
      memberId: c.memberId ? { ...c.memberId, _id: c.memberId._id?.toString() } : null,
      certTemplateId: c.certTemplateId
        ? {
            _id: c.certTemplateId._id?.toString(),
            name: c.certTemplateId.name,
            isActive: c.certTemplateId.isActive,
          }
        : null,
    }));
    res.json(mappedCertificates);
  } catch (error) {
    console.error('Certificate Fetch Error:', error);
    res.status(500).json({ error: 'Server Error fetching certificates.' });
  }
});

// GET /api/certificates/:id/render-config — template + member data for download/preview
router.get('/:id/render-config', authMiddleware, async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id)
      .populate('memberId', 'name member_id approvedAt updatedAt createdAt city whatsapp phone joining_year role status');
    if (!cert) return res.status(404).json({ error: 'Certificate not found.' });

    const isAdminUser = req.user.role === 'Admin' || req.user.role === 'Superuser';
    const ownerId = String(cert.memberId?._id || cert.memberId);
    if (!isAdminUser && String(req.user.memberId) !== ownerId) {
      return res.status(403).json({ error: 'Not allowed to download this certificate.' });
    }

    if (!cert.certTemplateId) {
      return res.status(400).json({
        error: 'This certificate has no uploaded template. Contact admin to re-issue.',
      });
    }

    const template = await CertTemplate.findById(cert.certTemplateId);
    if (!template) {
      return res.status(404).json({ error: 'Certificate template no longer exists.' });
    }

    const memberDoc = cert.memberId;
    return res.json({
      certificate: {
        _id: cert._id,
        title: cert.title,
        category: cert.category,
        customCategory: cert.customCategory,
        createdAt: cert.createdAt,
      },
      template: buildTemplatePayload(template),
      member: buildMemberRenderPayload(memberDoc),
    });
  } catch (error) {
    console.error('Certificate render-config error:', error);
    res.status(500).json({ error: 'Failed to load certificate for download.' });
  }
});

// GET /api/certificates/admin/all
router.get('/admin/all', authMiddleware, isAdmin, async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate('memberId', 'name member_id role')
      .populate('eventId', 'title date')
      .populate('issuedBy', 'name role')
      .populate('certTemplateId', 'name')
      .sort({ createdAt: -1 });

    res.json(certificates);
  } catch (error) {
    console.error('Fetch All Certificates Error:', error);
    res.status(500).json({ error: 'Server Error fetching all certificates.' });
  }
});

// DELETE /api/certificates/:id
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ error: 'Certificate not found.' });

    await Certificate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Certificate successfully revoked and deleted.' });
  } catch (error) {
    console.error('Delete Certificate Error:', error);
    res.status(500).json({ error: 'Server Error deleting certificate.' });
  }
});

module.exports = router;
