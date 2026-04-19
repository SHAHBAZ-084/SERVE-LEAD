const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Member = require('../models/Member');
const OTP = require('../models/OTP');
const { sendOTPEmail, sendResetPasswordEmail } = require('../utils/emailService');
const asyncHandler = require('../middlewares/asyncHandler');
const authMiddleware = require('../middlewares/authMiddleware');

// Current Member Profile
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
    // using .lean() properly cleans up the mongodb objectid types to pure json objects
    const member = await Member.findById(req.user.memberId || req.user.id).select('-password').lean();
    if (!member) return res.status(404).json({ error: 'User not found' });
    
    // Explicitly send both _id and id properties to satisfy front-end parsers
    res.json({
        ...member,
        _id: member._id.toString(),
        id: member._id.toString(),
        member_id: member.member_id || "Awaiting Approval",
        dbId: member._id.toString()
    });
}));

// Update Profile
router.put('/profile', authMiddleware, asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    if (password) {
        updateData.password = await bcrypt.hash(password, 12);
    }
    
    const member = await Member.findByIdAndUpdate(req.user.memberId, updateData, { new: true }).select('-password');
    res.json(member);
}));

// Verify Email availability
router.post('/check-email', asyncHandler(async (req, res) => {
    const { email } = req.body;
    const existing = await Member.findOne({ email: email.toLowerCase() });
    if (existing) {
        return res.status(400).json({ error: 'This Gmail is already registered.' });
    }
    res.status(200).json({ message: 'Email is available' });
}));

// Send Registration OTP
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required.' });

        // 1. Basic Regex for Gmail
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(email)) {
            return res.status(400).json({ error: 'Only official @gmail.com accounts are permitted.' });
        }

        // 2. Check Database Availability
        const existing = await Member.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ error: 'Account already exists for this Gmail.' });
        }

        // 3. Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 4. Save to DB (overwrite if already exists for this email)
        await OTP.deleteMany({ email: email.toLowerCase() });
        await OTP.create({ email: email.toLowerCase(), code: otpCode });

        // 5. Send Email
        const result = await sendOTPEmail(email, otpCode);
        if (!result.success) {
            return res.status(500).json({ 
                error: 'The email service failed to dispatch the code.',
                details: result.error 
            });
        }

        res.status(200).json({ message: 'Verification code sent to your Gmail.' });
    } catch (err) {
        console.error('Registration OTP Error:', err);
        res.status(500).json({ 
            error: 'Internal Server Error during OTP generation.',
            details: err.message
        });
    }
});

// Resend OTP
router.post('/resend-otp', asyncHandler(async (req, res) => {
    const { email } = req.body;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.deleteMany({ email: email.toLowerCase() });
    await OTP.create({ email: email.toLowerCase(), code: otpCode });
    
    const result = await sendOTPEmail(email, otpCode);
    if (!result.success) {
        return res.status(500).json({ error: 'Failed to resend code.' });
    }
    res.status(200).json({ message: 'New code sent!' });
}));

// Verify OTP
router.post('/verify-otp', asyncHandler(async (req, res) => {
    const { email, code } = req.body;
    const otp = await OTP.findOne({ email: email.toLowerCase(), code });
    if (!otp) {
        return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }
    await OTP.deleteMany({ email: email.toLowerCase() });
    res.status(200).json({ message: 'Email verified successfully.' });
}));

// Final Registration
router.post('/register', asyncHandler(async (req, res) => {
    // The frontend sends a flat formData object, not nested
    const formData = req.body;
    const email = formData.email?.toLowerCase();

    if (!email) return res.status(400).json({ error: 'Email is required' });

    const member = await Member.create({
        ...formData,
        email,
        status: 'pending'
    });

    const token = jwt.sign({ memberId: member._id, role: member.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({
        _id: member._id,
        name: member.name,
        email: member.email,
        token
    });
}));

// Member Login
router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const member = await Member.findOne({ email: email.toLowerCase() });
    
    if (!member) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check if password matches plaintext (older signups) or hashed (resets)
    let isMatch = false;
    if (member.password === password) {
        isMatch = true;
    } else {
        isMatch = await bcrypt.compare(password, member.password).catch(() => false);
    }

    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ memberId: member._id, role: member.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({
        token,
        member: {
            id: member._id,
            member_id: member.member_id,
            name: member.name,
            email: member.email,
            status: member.status,
            role: member.role,
            joining_year: member.joining_year
        }
    });
}));

// Forgot Password
router.post('/forgot-password', asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Please provide a valid email.' });

    const member = await Member.findOne({ email: email.toLowerCase() });
    if (!member) return res.status(404).json({ error: 'No account found with that email.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    member.resetPasswordToken = resetToken;
    member.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await member.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const mailResult = await sendResetPasswordEmail(member.email, member.name, resetUrl);

    if (!mailResult.success) {
        member.resetPasswordToken = undefined;
        member.resetPasswordExpire = undefined;
        await member.save();
        return res.status(500).json({ error: 'Email could not be sent. Please try again later.' });
    }

    res.status(200).json({ message: 'Reset link sent to your email.' });
}));

// Reset Password
router.post('/reset-password', asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Invalid request.' });

    const member = await Member.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!member) return res.status(400).json({ error: 'Invalid or expired reset token.' });

    member.password = await bcrypt.hash(newPassword, 12);
    member.resetPasswordToken = undefined;
    member.resetPasswordExpire = undefined;
    await member.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
}));

module.exports = router;

