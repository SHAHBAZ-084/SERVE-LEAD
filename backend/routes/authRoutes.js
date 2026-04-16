const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../middlewares/asyncHandler');
const authMiddleware = require('../middlewares/authMiddleware');
const OTP = require('../models/OTP');
const { sendResetPasswordEmail, sendOTPEmail } = require('../utils/emailService');

// Login Rate Limiter: Protects against brute force while easing limits locally
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 10 : 5000,
    message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
});

const dns = require('dns').promises;

// Check Email Availability & Domain Validity
router.post('/check-email', asyncHandler(async (req, res) => {
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
        return res.status(400).json({ error: 'This Gmail is already registered.' });
    }

    // 3. Simple email format validation is enough since we only permit gmail.com
    if (!email.toLowerCase().endsWith('@gmail.com')) {
        return res.status(400).json({ error: 'Only official @gmail.com accounts are permitted.' });
    }

    res.status(200).json({ message: 'Email is available' });
}));

// Send Registration OTP
router.post('/send-otp', asyncHandler(async (req, res) => {
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
    const success = await sendOTPEmail(email, otpCode);
    if (!success) {
        return res.status(500).json({ error: 'Failed to send verification code. Please check your internet connection.' });
    }

    res.status(200).json({ message: 'Verification code sent to your Gmail.' });
}));

// Request Password Reset
router.post('/forgot-password', asyncHandler(async (req, res) => {
    const { email } = req.body;
    const member = await Member.findOne({ email });

    if (!member) {
        return res.status(404).json({ error: 'Account not found. Please check your email or register.' });
    }

    if (member.role === 'Superuser') {
        return res.status(403).json({ error: 'Super Admin credentials must be managed via higher authorization protocols.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    member.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    member.resetPasswordExpire = Date.now() + 600000; // 10 minutes

    await member.save();

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendBase}${frontendBase.endsWith('/') ? '' : '/'}reset-password/${resetToken}`;
    const success = await sendResetPasswordEmail(member.email, member.name, resetUrl);

    if (!success) {
        member.resetPasswordToken = undefined;
        member.resetPasswordExpire = undefined;
        await member.save();
        return res.status(500).json({ error: 'Email could not be sent. Please contact support.' });
    }

    res.status(200).json({ message: 'Reset link sent to your registered Gmail.' });
}));

// Reset Password
router.post('/reset-password/:token', asyncHandler(async (req, res) => {
    const { password } = req.body;
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const member = await Member.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!member) {
        return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const isSameAsOld = await bcrypt.compare(password, member.password);
    if (isSameAsOld) {
        return res.status(400).json({ error: 'Security Conflict: New password cannot be the same as your current password.' });
    }

    member.password = await bcrypt.hash(password, 12);
    member.resetPasswordToken = undefined;
    member.resetPasswordExpire = undefined;

    await member.save();
    res.status(200).json({ message: 'Password reset successful! You can now login.' });
}));

// Register a new member
router.post('/register', asyncHandler(async (req, res) => {
    const { 
        name, email, password, otp, joining_year,
        father_name, whatsapp, education_level, program, 
        passing_year, university, address, city 
    } = req.body;

    if (!name || !email || !password || !otp) {
        return res.status(400).json({ error: 'Name, Email, Password, and OTP are required.' });
    }

    // Verify OTP
    const validOtp = await OTP.findOne({ email: email.toLowerCase(), code: otp });
    if (!validOtp) {
        return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = await Member.findOne({ email: email.toLowerCase() });
    if (existing) {
        return res.status(400).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newMember = new Member({
        name, email: email.toLowerCase(), password: hashedPassword, joining_year,
        father_name, whatsapp, education_level, program, 
        passing_year, university, address, city,
        role: 'General', status: 'pending'
    });

    await newMember.save();
    
    // Delete OTP after successful registration
    await OTP.deleteOne({ _id: validOtp._id });

    res.status(201).json({ message: 'Registration successful! Awaiting admin approval.' });
}));

// Member Login
router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const member = await Member.findOne({ email: email.toLowerCase() });
    if (!member) {
        return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (member.role === 'Admin' || member.role === 'Superuser') {
        return res.status(403).json({ error: 'Administrative accounts must use the Admin Portal.' });
    }

    if (member.status === 'pending') {
        return res.status(403).json({ error: 'Your application is still pending. Please wait for an Administrator to approve your official status.' });
    }

    if (member.status === 'blocked') {
        return res.status(403).json({ error: 'Your account has been suspended by an Administrator.' });
    }

    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const payload = { memberId: member._id, role: member.role, status: member.status };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Set Secure HttpOnly Cookie
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ 
        message: 'Login successful',
        token,
        member: { 
            id: member._id, 
            name: member.name, 
            email: member.email, 
            role: member.role, 
            member_id: member.member_id,
            status: member.status,
            interview_called: member.interview_called
        } 
    });
}));

// GET /me - Check current status
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
    const member = await Member.findById(req.user.memberId).select('-password');
    if (!member) return res.status(404).json({ error: 'User not found' });
    res.json(member);
}));

// Logout
router.post('/logout', (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 });
    res.status(200).json({ message: 'Logged out successfully' });
});

// Update Profile
router.put('/profile', authMiddleware, asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const member = await Member.findById(req.user.memberId);

    if (!member) return res.status(404).json({ error: 'Member not found.' });

    if (name) member.name = name;
    if (email && email !== member.email) {
        const existing = await Member.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(400).json({ error: 'Email already in use.' });
        member.email = email.toLowerCase();
    }
    if (password) {
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        }
        const isSameAsOld = await bcrypt.compare(password, member.password);
        if (isSameAsOld) return res.status(400).json({ error: 'New password cannot be the same as your current password.' });
        member.password = await bcrypt.hash(password, 12);
    }

    await member.save();
    res.json({ message: 'Profile updated successfully', member: { name: member.name, email: member.email } });
}));

module.exports = router;

