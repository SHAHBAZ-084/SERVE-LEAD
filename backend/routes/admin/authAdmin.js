const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Member = require('../../models/Member');
const authMiddleware = require('../../middlewares/authMiddleware');
const asyncHandler = require('../../middlewares/asyncHandler');
const { isAdmin } = require('../../middlewares/adminMiddlewares');
const logActivity = require('../../utils/activityLogger');

// Admin Login
router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const member = await Member.findOne({ email: email.toLowerCase() });

    if (!member || (member.role !== 'Admin' && member.role !== 'Superuser')) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    if (member.status === 'blocked') {
        return res.status(403).json({ error: 'Your account is blocked.' });
    }

    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid admin credentials' });

    const payload = { memberId: member._id, role: member.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ username: member.name, is_superuser: member.role === 'Superuser' });
    logActivity(member._id, 'Login', `Logged into Admin Portal`);
}));

// Admin Profile
router.get('/profile', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const admin = await Member.findById(req.user.memberId).select('-password').lean();
    res.json(admin);
}));

router.put('/profile', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { name, oldPassword, newPassword } = req.body;
    const admin = await Member.findById(req.user.memberId);
    if (!admin) return res.status(404).json({ error: 'Administrator record not found.' });

    if (name) admin.name = name;
    
    // Security check: must provide current password to set a new one
    if (newPassword) {
        if (!oldPassword) {
            return res.status(400).json({ error: 'Current password is required to authorize a security change.' });
        }
        
        const isMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Authentication failed: Incorrect current password.' });
        }
        
        admin.password = await bcrypt.hash(newPassword, 12);
    }

    await admin.save();
    res.json({ message: 'Security credentials updated successfully.', name: admin.name });
    logActivity(req.user.memberId, 'ADMIN_PROFILE_UPDATE', `Updated profile security settings for ${admin.name}`);
}));

// Admin Logout
router.post('/logout', (req, res) => {
    res.cookie('jwt', '', { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: new Date(0) 
    });
    res.json({ message: 'Logged out' });
});

module.exports = router;
