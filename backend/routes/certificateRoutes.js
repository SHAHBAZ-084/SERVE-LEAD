const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Certificate = require('../models/Certificate');
const Member = require('../models/Member');
const Event = require('../models/Event');
const authMiddleware = require('../middlewares/authMiddleware');
const { ensureMembershipCertificate } = require('../utils/membershipCertificate');

// Middleware to check if user is Admin
const isAdmin = async (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Superuser')) {
    // Re-verify status against DB to enforce immediate blocks
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

// 1. POST /api/certificates - Issue a new certificate (Admin only)
router.post('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { memberId, eventId, category, customCategory, description, chairmanName, title, awardType, templateId } = req.body;

    if (!memberId) {
      console.error('Issuance Fail: Missing memberId');
      return res.status(400).json({ error: 'Member ID is required.' });
    }

    // Validate Member
    const member = await Member.findOne({ _id: memberId });
    if (!member) {
      console.error(`Issuance Fail: Member ${memberId} not found`);
      return res.status(404).json({ error: 'Member not found.' });
    }

    // Validate Event if provided
    let validEventId = null;
    if (eventId) {
        const event = await Event.findById(eventId);
        if (!event) {
          console.error(`Issuance Fail: Event ${eventId} not found`);
          return res.status(404).json({ error: 'Event not found.' });
        }
        validEventId = event._id;
    }

    // Category check
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
      templateId: templateId || 1,
    });

    await newCert.save();

    res.status(201).json({ message: 'Certificate issued successfully.', certificate: newCert });

  } catch (error) {
    console.error('CRITICAL: Issue Certificate Error:', error.message, error.stack);
    res.status(500).json({ error: 'An unexpected error occurred while issuing the certificate.' });
  }
});

// POST /api/certificates/bulk - Bulk issue to selected members (or event attendees)
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

    let targetMembers = [];
    let validEventId = null;

    // Preferred: admin picks members directly
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
      // Fallback: all attended participants of an event
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

// 2. GET /api/certificates/member/me - Fetch my certificates (Logged-in member)
router.get('/member/me', authMiddleware, async (req, res) => {
    try {
        let queryMemberId = req.user.memberId;
        const query = {};
        if (mongoose.Types.ObjectId.isValid(queryMemberId)) {
            query.memberId = queryMemberId;

            const member = await Member.findById(queryMemberId).select('name member_id status role joining_year');
            if (member) {
                await ensureMembershipCertificate(member).catch((err) => {
                    console.error('Backfill membership certificate failed:', err.message);
                });
            }
        } else {
            // Fallback for older string based tokens
            query.member_id_str = queryMemberId;
        }

        const certificates = await Certificate.find(query)
            .populate('eventId', 'title date location')
            .populate('memberId', 'name member_id role joining_year status')
            .sort({ createdAt: -1 })
            .lean();

        const mappedCertificates = certificates.map(c => ({
            ...c, 
            _id: c._id?.toString(), 
            eventId: c.eventId ? { ...c.eventId, _id: c.eventId._id?.toString() } : null, 
            memberId: c.memberId ? { ...c.memberId, _id: c.memberId._id?.toString() } : null
        }));
        res.json(mappedCertificates);
    } catch (error) { 
        console.error("Certificate Fetch Error:", error);
        res.status(500).json({ error: 'Server Error fetching certificates.' }); 
    }
});

// 3. GET /api/certificates/admin/all - Fetch all issued certificates (Admin only)
router.get('/admin/all', authMiddleware, isAdmin, async (req, res) => {
    try {
        const certificates = await Certificate.find()
            .populate('memberId', 'name member_id role')
            .populate('eventId', 'title date')
            .populate('issuedBy', 'name role')
            .sort({ createdAt: -1 });

        res.json(certificates);
    } catch (error) {
        console.error('Fetch All Certificates Error:', error);
        res.status(500).json({ error: 'Server Error fetching all certificates.' });
    }
});

// 4. DELETE /api/certificates/:id - Revoke a certificate (Admin only)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const cert = await Certificate.findById(req.params.id);
        if(!cert) return res.status(404).json({ error: 'Certificate not found.' });

        await Certificate.findByIdAndDelete(req.params.id);
        res.json({ message: 'Certificate successfully revoked and deleted.' });
    } catch (error) {
        console.error('Delete Certificate Error:', error);
        res.status(500).json({ error: 'Server Error deleting certificate.' });
    }
});

// GET /api/certificates/my-data - Member certificate data for PDF generation
router.get('/my-data', authMiddleware, async (req, res) => {
  try {
    const member = await Member.findById(req.user.memberId || req.user.id)
      .select('name member_id approvedAt city status updatedAt');
    if (!member) return res.status(404).json({ error: 'Member not found' });
    if (member.status !== 'approved')
      return res.status(403).json({ error: 'Certificate not available. Membership not approved.' });
    return res.json({
      name: member.name,
      memberId: member.member_id,
      approvedAt: member.approvedAt || member.updatedAt,
      city: member.city,
    });
  } catch (error) {
    console.error('Certificate my-data error:', error);
    res.status(500).json({ error: 'Server error fetching certificate data.' });
  }
});

module.exports = router;
