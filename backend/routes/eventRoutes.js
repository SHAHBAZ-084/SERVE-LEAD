const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Member = require('../models/Member');
const authMiddleware = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware to check if user is Admin
const isAdmin = asyncHandler(async (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Superuser')) {
        const user = await Member.findById(req.user.memberId).lean();
        if (!user || user.status === 'blocked') {
            return res.status(403).json({ error: 'Access denied. Account is blocked.' });
        }
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin only.' });
    }
});

const { createUpload, getFileUrl, deleteFile } = require('../utils/storage');

// Multer Config (Hybrid: Local/Cloud)
const upload = createUpload('events');

// GET all active events (Member view)
router.get('/', asyncHandler(async (req, res) => {
    const events = await Event.find({ is_active: true }).sort({ date: -1 }).lean();
    
    // Explicitly stringify all ObjectIds so React matches them flawlessly
    const mappedEvents = events.map(e => ({
        ...e,
        _id: e._id.toString(),
        participants: e.participants ? e.participants.map(p => ({
            ...p,
            memberId: p.memberId ? p.memberId.toString() : null
        })) : []
    }));
    
    res.json(mappedEvents);
}));

// GET all events (Admin view)
router.get('/admin', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const events = await Event.find().sort({ date: -1 }).lean();
    res.json(events);
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    let event = null;
    if (mongoose.isValidObjectId(id)) {
        event = await Event.findOne({ _id: id, is_active: true }).lean();
    }
    if (!event) {
        event = await Event.findOne({ slug: id, is_active: true }).lean();
    }
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({
        ...event,
        _id: event._id.toString(),
        participants: event.participants ? event.participants.map(p => ({
            ...p,
            memberId: p.memberId ? p.memberId.toString() : null
        })) : []
    });
}));

// GET participants for a specific event (Admin only - with pagination)
router.get('/:id/participants', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const event = await Event.findById(req.params.id)
        .populate({
            path: 'participants.memberId',
            select: 'name email member_id serial_number',
            options: { limit: parseInt(limit), skip: (page - 1) * limit }
        })
        .lean();
    
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event.participants);
}));

// POST Join an event (Member only)
router.post('/:id/join', authMiddleware, asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Use registrationDeadline if set, otherwise fallback to event start date
    const joinDeadline = event.registrationDeadline || event.date;
    if (new Date() > new Date(joinDeadline)) {
        return res.status(400).json({ 
            error: event.registrationDeadline 
                ? 'Registration deadline has passed.' 
                : 'Registration closed (Event has already started).' 
        });
    }

    if (new Date() > new Date(event.endDate)) {
        return res.status(400).json({ error: 'This event has concluded.' });
    }

    const alreadyJoined = event.participants.some(p => p.memberId.toString() === req.user.memberId);
    if (alreadyJoined) return res.status(400).json({ error: 'You have already joined.' });

    event.participants.push({ memberId: req.user.memberId });
    await event.save();
    res.json({ message: 'Successfully joined!', event });
}));

// POST Create an event (Admin only)
router.post('/', authMiddleware, isAdmin, upload.single('image'), asyncHandler(async (req, res) => {
    const { title, description, date, endDate, registrationDeadline, location, is_active, time } = req.body;
    const image_url = getFileUrl(req.file, 'events');

    try {
        if (!title || !date) return res.status(400).json({ error: 'Title and Start Date are required.' });
        
        const start = new Date(date);
        const end = new Date(endDate || date);
        const deadline = registrationDeadline ? new Date(registrationDeadline) : null;

        if (end < start) {
            return res.status(400).json({ error: 'End Date cannot be before the Start Date.' });
        }

        if (deadline && deadline > start) {
             return res.status(400).json({ error: 'Registration deadline must be before or on the event start date.' });
        }

        let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        
        // Ensure slug uniqueness before saving
        let slugExists = await Event.findOne({ slug });
        if (slugExists) {
            slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
        }

        const newEvent = new Event({ 
            title, slug, description, date: start, endDate: end, registrationDeadline: deadline,
            location, is_active: is_active === 'true' || is_active === true, 
            image_url, time 
        });

        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'An event with a similar title already exists. Please use a unique title.' });
        }
        throw error; // Let asyncHandler catch other errors
    }
}));

// PATCH Update participant attendance (Admin only)
router.patch('/:id/attendance', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { memberId, attended } = req.body;
    if (!memberId) return res.status(400).json({ error: 'Member ID is required.' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    const participant = event.participants.find(p => {
        const id = p.memberId._id ? p.memberId._id.toString() : p.memberId.toString();
        return id === memberId;
    });
    if (!participant) return res.status(404).json({ error: 'Member is not registered for this event.' });

    participant.attended = attended === true || attended === 'true';
    await event.save();

    res.json({ message: 'Attendance updated successfully.', attended: participant.attended });
}));

// PATCH Bulk Update participant attendance (Admin only)
router.patch('/:id/attendance/bulk', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { attended, ids } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    if (ids && Array.isArray(ids)) {
        event.participants.forEach(p => {
            if (ids.includes(p.memberId.toString())) {
                p.attended = attended === true || attended === 'true';
            }
        });
    } else {
        event.participants.forEach(p => {
            p.attended = attended === true || attended === 'true';
        });
    }
    
    await event.save();
    res.json({ 
        message: `Successfully updated attendance for ${ids ? ids.length : 'all'} participants.`, 
        count: ids ? ids.length : event.participants.length 
    });
}));

// DELETE Event (Admin only)
router.delete('/:id', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Delete associated image from S3/Local Storage
    if (event.image_url) {
        await deleteFile(event.image_url);
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event and associated image deleted' });
}));

module.exports = router;
