const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // limit each IP to 3 OTP requests per window
    message: { error: 'Too many OTP requests. Please try again after 5 minutes.' }
});

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
    const member = await Member.findById(req.user.memberId);
    if (!member) return res.status(404).json({ error: 'Account record not found.' });

    if (name) member.name = name;
    if (email && email.toLowerCase() !== member.email) {
        const existing = await Member.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(400).json({ error: 'This email is already linked to another account.' });
        member.email = email.toLowerCase();
    }
    
    if (password) {
        member.password = await bcrypt.hash(password, 12);
    }
    
    await member.save();
    res.json({ 
        message: 'Profile security updated successfully.', 
        member: { id: member._id, name: member.name, email: member.email } 
    });
}));

// Verify Email availability
router.post('/check-email', asyncHandler(async (req, res) => {
    const { email: rawEmail } = req.body;
    const email = rawEmail?.trim().toLowerCase();
    const existing = await Member.findOne({ email });
    if (existing) {
        return res.status(400).json({ error: 'This Gmail is already registered.' });
    }
    res.status(200).json({ message: 'Email is available' });
}));

// Send Registration OTP
router.post('/send-otp', otpLimiter, async (req, res) => {
    try {
        const { email: rawEmail } = req.body;
        if (!rawEmail) return res.status(400).json({ error: 'Email is required.' });
        const email = rawEmail.trim().toLowerCase();

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

        // 3. Generate 6-digit OTP (securely)
        const otpCode = crypto.randomInt(100000, 1000000).toString();

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
router.post('/resend-otp', otpLimiter, asyncHandler(async (req, res) => {
    const { email: rawEmail } = req.body;
    const email = rawEmail?.trim().toLowerCase();
    
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
        return res.status(400).json({ error: 'Only official @gmail.com accounts are permitted.' });
    }
    
    const existing = await Member.findOne({ email: email.toLowerCase() });
    if (existing) {
        return res.status(400).json({ error: 'Account already exists for this Gmail.' });
    }

    const otpCode = crypto.randomInt(100000, 1000000).toString();
    await OTP.deleteMany({ email });
    await OTP.create({ email, code: otpCode });
    
    const result = await sendOTPEmail(email, otpCode);
    if (!result.success) {
        return res.status(500).json({ error: 'Failed to resend code.' });
    }
    res.status(200).json({ message: 'New code sent!' });
}));

// Verify OTP
router.post('/verify-otp', asyncHandler(async (req, res) => {
    const { email: rawEmail, code } = req.body;
    const email = rawEmail?.trim().toLowerCase();
    const otp = await OTP.findOne({ email, code });
    if (!otp) {
        return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }
    // Mark as verified instead of deleting immediately, so /register can check it
    otp.code = "VERIFIED";
    otp.createdAt = new Date(); // Refresh TTL to give user more time to finish form
    await otp.save();
    res.status(200).json({ message: 'Email verified successfully.' });
}));

// Final Registration
router.post('/register', asyncHandler(async (req, res) => {
    const {
        name,
        email: rawEmail,
        password,
        joining_year,
        father_name,
        whatsapp,
        education_level,
        program,
        passing_year,
        university,
        address,
        city
    } = req.body;

    const email = rawEmail?.trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!password) return res.status(400).json({ error: 'Password is required' });

    // ✅ Re-verify OTP on backend (prevent direct API bypass)
    // We check for the "VERIFIED" flag set by the /verify-otp route
    const otpRecord = await OTP.findOne({ email, code: "VERIFIED" });
    if (!otpRecord) {
        return res.status(400).json({
            error: 'Email not verified. Please complete OTP verification first.'
        });
    }
    // ✅ Delete OTP after confirming (one-time use)
    await OTP.deleteMany({ email });

    const hashedPassword = await bcrypt.hash(password, 12);

    const member = await Member.create({
        name,
        email,
        password: hashedPassword,
        joining_year,
        father_name,
        whatsapp,
        education_level,
        program,
        passing_year,
        university,
        address,
        city,
        status: 'pending',
        role: 'General' // Explicitly enforce default role
    });

    res.status(201).json({
        _id: member._id,
        name: member.name,
        email: member.email
    });
}));

// Executive Registration (Internal/Hidden link use)
router.post('/register-executive', asyncHandler(async (req, res) => {
    const {
        name,
        email: rawEmail,
        password,
        joining_year,
        father_name,
        whatsapp,
        education_level,
        program,
        passing_year,
        university,
        address,
        city,
        sls_official_id,
        cnic_number
    } = req.body;

    const email = rawEmail?.trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!password) return res.status(400).json({ error: 'Password is required' });

    // ✅ Re-verify OTP on backend
    const otpRecord = await OTP.findOne({ email, code: "VERIFIED" });
    if (!otpRecord) {
        return res.status(400).json({
            error: 'Email not verified. Please complete OTP verification first.'
        });
    }
    await OTP.deleteMany({ email });

    const hashedPassword = await bcrypt.hash(password, 12);

    const member = await Member.create({
        name,
        email,
        password: hashedPassword,
        joining_year,
        father_name,
        whatsapp,
        education_level,
        program,
        passing_year,
        university,
        address,
        city,
        sls_official_id,
        cnic_number,
        status: 'pending',
        role: 'Executive' // Sets role to Executive
    });

    res.status(201).json({
        _id: member._id,
        name: member.name,
        email: member.email
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

    // Check for pending or restricted application status
    if (member.status === 'pending' && !member.interview_called) {
        return res.status(403).json({ 
            error: 'Your application is under processing. Access will be granted once your membership is approved.' 
        });
    }

    if (member.status === 'blocked') {
        return res.status(403).json({ 
            error: 'Your account access has been restricted. Please contact support.' 
        });
    }

    // Role-based Access Control: Prevent Admins/Superusers from logging into Member Portal
    if (member.role === 'Admin' || member.role === 'Superuser') {
        return res.status(403).json({ 
            error: 'Administrative accounts must login through the Admin Portal.' 
        });
    }

    // Check if password matches hashed password
    const isMatch = await bcrypt.compare(password, member.password).catch(() => false);

    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ memberId: member._id, role: member.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
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

// Member Logout
router.post('/logout', (req, res) => {
    res.cookie('jwt', '', { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: new Date(0) 
    });
    res.status(200).json({ message: 'Logged out successfully.' });
});

// Forgot Password
router.post('/forgot-password', asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Please provide a valid email.' });

    const member = await Member.findOne({ email: email.toLowerCase() });
    if (!member) return res.status(404).json({ error: 'No account found with that email.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    member.resetPasswordToken = hashedToken;
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

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const member = await Member.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!member) return res.status(400).json({ error: 'Invalid or expired reset token.' });

    member.password = await bcrypt.hash(newPassword, 12);
    member.resetPasswordToken = undefined;
    member.resetPasswordExpire = undefined;
    await member.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
}));

// Public Membership Verification
router.get('/verify/:member_id', asyncHandler(async (req, res) => {
    const { member_id } = req.params;
    
    // Find approved members only
    const member = await Member.findOne({ 
        member_id: member_id.trim().toUpperCase(), // Ensure uppercase matching
        status: 'approved'
    }).select('name joining_year role profile_pic_url');

    if (!member) {
        return res.status(404).json({ error: 'Invalid ID. No official member found with this ID.' });
    }

    res.json({
        success: true,
        message: `${member.name} is an official member of Serve & Lead Society.`,
        member: {
            name: member.name,
            joining_year: member.joining_year,
            role: member.role,
            profile_pic_url: member.profile_pic_url
        }
    });
}));

module.exports = router;

