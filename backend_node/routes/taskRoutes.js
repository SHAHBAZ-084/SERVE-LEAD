const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
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

// GET all relevant tasks (Member view)
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
    const tasks = await Task.find({ 
        $or: [{ assigned_to: 'All' }, { assigned_to: req.user.memberId }] 
    }).sort({ createdAt: -1 }).lean();
    res.json(tasks);
}));

// POST Create a task (Admin only)
router.post('/', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { title, description, deadline, assigned_to } = req.body;
    if (!title || !description || !deadline) return res.status(400).json({ error: 'Missing information.' });
    
    const newTask = new Task({ title, description, deadline, assigned_to });
    await newTask.save();
    res.status(201).json(newTask);
}));

module.exports = router;

