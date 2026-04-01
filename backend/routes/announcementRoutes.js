const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const Member = require('../models/Member');
const authMiddleware = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

// Unified Admin Check
const isAdmin = asyncHandler(async (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Superuser')) {
        const user = await Member.findById(req.user.memberId).lean();
        if (!user || user.status === 'blocked') return res.status(403).json({ error: 'Blocked account.' });
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin only.' });
    }
});

// GET all announcements (Member view)
router.get('/', asyncHandler(async (req, res) => {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
    res.json(announcements);
}));

// POST Create an announcement (Admin only)
router.post('/', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { title, content, type } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Missing content.' });
    const newAnnouncement = new Announcement({ title, content, type });
    await newAnnouncement.save();
    res.status(201).json(newAnnouncement);
}));

// DELETE announcement (Admin only)
router.delete('/:id', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted' });
}));

module.exports = router;

