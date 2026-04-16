const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Member = require('../models/Member');
const OTP = require('../models/OTP');
const { sendOTPEmail } = require('../utils/emailService');
const asyncHandler = require('express-async-handler');

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
    const { personalInfo, educationInfo, locationInfo, password } = req.body;
    const email = personalInfo.email.toLowerCase();

    const member = await Member.create({
        ...personalInfo,
        ...educationInfo,
        ...locationInfo,
        email,
        password,
        status: 'pending'
    });

    const token = jwt.sign({ id: member._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({
        _id: member._id,
        name: member.name,
        email: member.email,
        token
    });
}));

module.exports = router;
