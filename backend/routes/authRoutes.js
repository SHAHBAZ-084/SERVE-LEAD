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
const ExecutiveApplication = require('../models/ExecutiveApplication');
const OTP = require('../models/OTP');
const { sendOTPEmail, sendResetPasswordEmail } = require('../utils/emailService');
const asyncHandler = require('../middlewares/asyncHandler');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateRequest, schemas } = require('../middlewares/validationMiddleware');

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
    // Extend TTL for verified record to 10 minutes so user has time to finish the form
    otp.createdAt = new Date(Date.now() + 300000); 
    await otp.save();
    res.status(200).json({ message: 'Email verified successfully.' });
}));

// Final Registration (General + Executive via requestedRole)
router.post('/register', validateRequest(schemas.register), asyncHandler(async (req, res) => {
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
        province,
        district,
        tehsil,
        requestedRole: rawRequestedRole,
        sls_official_id,
        cnic_number,
        referredBy,
    } = req.body;

    const email = rawEmail?.trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!password) return res.status(400).json({ error: 'Password is required' });

    const requestedRole = rawRequestedRole === 'Executive' ? 'Executive' : 'General';

    if (requestedRole === 'Executive') {
        if (!sls_official_id?.trim() || !cnic_number?.trim()) {
            return res.status(400).json({ error: 'SLS Official ID and CNIC are required for Executive membership.' });
        }
    }

    if (!address?.trim()) {
        return res.status(400).json({ error: 'Residential address is required.' });
    }
    if (!province?.trim() || !district?.trim() || !tehsil?.trim()) {
        return res.status(400).json({ error: 'Province, district, and tehsil are required.' });
    }

    const tehsilName = tehsil.trim();

    let referred_by = null;
    if (referredBy?.trim()) {
        const referrer = await Member.findOne({
            member_id: referredBy.trim().toUpperCase(),
            status: 'approved',
        });
        if (!referrer) {
            return res.status(400).json({ error: 'Invalid referrer member ID.' });
        }
        if (referrer.role === 'General' && requestedRole === 'General') {
            return res.status(403).json({
                error: 'General members cannot sponsor General membership applications.',
            });
        }
        referred_by = referrer._id;
    }

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
        address: address?.trim(),
        province: province?.trim(),
        district: district?.trim(),
        tehsil: tehsilName,
        city: tehsilName,
        requestedRole,
        sls_official_id: requestedRole === 'Executive' ? sls_official_id?.trim() : '',
        cnic_number: requestedRole === 'Executive' ? cnic_number?.trim() : '',
        referred_by,
        status: 'pending',
        role: 'General',
    });

    res.status(201).json({
        _id: member._id,
        name: member.name,
        email: member.email,
        requestedRole: member.requestedRole,
    });
}));

// Member Login
// Member Login
router.post('/login', validateRequest(schemas.login), asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const member = await Member.findOne({ email: email.toLowerCase() });
    
    if (!member) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check for pending or restricted application status
    if (member.status === 'rejected') {
        return res.status(403).json({
            error: 'Your application was not successful following the interview process. Better luck in the future.',
        });
    }

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

    // Security: Use timingSafeEqual to prevent timing attacks
    // We find all members with active expiry and then compare in memory
    const activeMembers = await Member.find({
        resetPasswordExpire: { $gt: Date.now() }
    }).select('resetPasswordToken password');

    const member = activeMembers.find(m => {
        if (!m.resetPasswordToken) return false;
        try {
            return crypto.timingSafeEqual(
                Buffer.from(m.resetPasswordToken, 'hex'),
                Buffer.from(hashedToken, 'hex')
            );
        } catch (e) {
            return false;
        }
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

// Verify General Member eligibility for executive upgrade (public)
router.get('/verify-member', asyncHandler(async (req, res) => {
    const member_id = (req.query.member_id || '').trim().toUpperCase();
    const email = (req.query.email || '').trim().toLowerCase();

    if (!member_id || !email) {
        return res.status(400).json({ error: 'Membership ID and email are required.' });
    }

    const member = await Member.findOne({
        member_id,
        email,
        role: 'General',
        status: 'approved',
    }).select('name _id');

    if (!member) {
        return res.status(400).json({ error: 'No approved General Member found with this ID and email combination.' });
    }

    res.json({ valid: true, name: member.name, memberId: member._id.toString() });
}));

// Submit executive upgrade application (public — guarded by memberId re-verification)
router.post('/apply-executive', asyncHandler(async (req, res) => {
    const {
        memberId,
        mission_statement,
        short_term_goals,
        long_term_goals,
        area_of_interest,
        skills,
        previous_volunteer_experience,
        why_executive,
        availability,
        linkedin_url,
        name,
        father_name,
        city,
        address,
    } = req.body;

    if (!memberId) {
        return res.status(400).json({ error: 'Member verification is required.' });
    }

    const member = await Member.findById(memberId);
    if (!member) {
        return res.status(400).json({ error: 'Invalid member reference.' });
    }
    if (member.role !== 'General' || member.status !== 'approved') {
        return res.status(400).json({ error: 'Only approved General Members can apply for Executive membership.' });
    }

    const existingPending = await ExecutiveApplication.findOne({ memberId: member._id, status: 'pending' });
    if (existingPending) {
        return res.status(400).json({ error: 'You have already submitted an executive application.' });
    }

    const existingAny = await ExecutiveApplication.findOne({ memberId: member._id });
    if (existingAny) {
        return res.status(400).json({ error: 'An executive application already exists for this member.' });
    }

    if (!name?.trim() || !father_name?.trim() || !city?.trim() || !address?.trim()) {
        return res.status(400).json({ error: 'Name, father name, city, and address are required.' });
    }
    if (!area_of_interest?.trim() || !skills?.trim()) {
        return res.status(400).json({ error: 'Area of interest and skills are required.' });
    }
    if (!mission_statement?.trim() || mission_statement.trim().length < 50) {
        return res.status(400).json({ error: 'Mission statement must be at least 50 characters.' });
    }
    if (!short_term_goals?.trim() || short_term_goals.trim().length < 30) {
        return res.status(400).json({ error: 'Short-term goals must be at least 30 characters.' });
    }
    if (!long_term_goals?.trim() || long_term_goals.trim().length < 30) {
        return res.status(400).json({ error: 'Long-term goals must be at least 30 characters.' });
    }
    if (!why_executive?.trim() || why_executive.trim().length < 50) {
        return res.status(400).json({ error: 'Why Executive must be at least 50 characters.' });
    }

    const hours = Number(availability);
    if (!hours || hours < 1 || hours > 40) {
        return res.status(400).json({ error: 'Availability must be between 1 and 40 hours per week.' });
    }

    await ExecutiveApplication.create({
        memberId: member._id,
        memberName: member.name,
        member_id_str: member.member_id || '',
        name: name.trim(),
        father_name: father_name.trim(),
        city: city.trim(),
        address: address.trim(),
        mission_statement: mission_statement.trim(),
        short_term_goals: short_term_goals.trim(),
        long_term_goals: long_term_goals.trim(),
        area_of_interest: area_of_interest.trim(),
        skills: skills.trim(),
        previous_volunteer_experience: (previous_volunteer_experience || '').trim(),
        why_executive: why_executive.trim(),
        availability: hours,
        linkedin_url: (linkedin_url || '').trim(),
    });

    res.status(201).json({ message: 'Executive application submitted successfully.' });
}));

module.exports = router;

