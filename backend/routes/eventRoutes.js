const express = require('express');
const router = express.Router();
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

// Multer Config
const uploadDir = path.join(__dirname, '..', 'uploads', 'events');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`)
});

const upload = multer({ 
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        cb(new Error('Only images (jpg, png, webp) are allowed'));
    }
});

// GET all active events (Member view)
router.get('/', asyncHandler(async (req, res) => {
    const events = await Event.find({ is_active: true }).sort({ date: -1 }).lean();
    res.json(events);
}));

// GET all events (Admin view)
router.get('/admin', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const events = await Event.find().sort({ date: -1 }).lean();
    res.json(events);
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

    if (new Date() > new Date(event.endDate)) {
        return res.status(400).json({ error: 'This event has ended.' });
    }

    const alreadyJoined = event.participants.some(p => p.memberId.toString() === req.user.memberId);
    if (alreadyJoined) return res.status(400).json({ error: 'You have already joined.' });

    event.participants.push({ memberId: req.user.memberId });
    await event.save();
    res.json({ message: 'Successfully joined!', event });
}));

// POST Create an event (Admin only)
router.post('/', authMiddleware, isAdmin, upload.single('image'), asyncHandler(async (req, res) => {
    const { title, description, date, endDate, location, is_active, time } = req.body;
    const image_url = req.file ? `/uploads/events/${req.file.filename}` : '';

    try {
        let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        
        // Ensure slug uniqueness before saving
        let slugExists = await Event.findOne({ slug });
        if (slugExists) {
            slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
        }

        const newEvent = new Event({ 
            title, slug, description, date, endDate: endDate || date,
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

// DELETE Event (Admin only)
router.delete('/:id', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
}));

module.exports = router;
