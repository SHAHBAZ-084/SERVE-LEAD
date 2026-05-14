const express = require('express');
const router = express.Router();
const Member = require('../../models/Member');
const Event = require('../../models/Event');
const Counter = require('../../models/Counter');
const Log = require('../../models/Log');
const Announcement = require('../../models/Announcement');
const Certificate = require('../../models/Certificate');
const EventCertificate = require('../../models/EventCertificate');
const SystemSetting = require('../../models/SystemSetting');
const Task = require('../../models/Task');
const authMiddleware = require('../../middlewares/authMiddleware');
const asyncHandler = require('../../middlewares/asyncHandler');
const { isSuperuser } = require('../../middlewares/adminMiddlewares');
const logActivity = require('../../utils/activityLogger');
const crypto = require('crypto');
const OTP = require('../../models/OTP');
const { sendOTPEmail } = require('../../utils/emailService');

// 1. Request OTP for Backup (Superuser only)
router.post('/backup/request-otp', authMiddleware, isSuperuser, asyncHandler(async (req, res) => {
    const admin = await Member.findById(req.user.memberId);
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });

    const otpCode = crypto.randomInt(100000, 1000000).toString();
    await OTP.deleteMany({ email: admin.email });
    await OTP.create({ email: admin.email, code: otpCode });

    await sendOTPEmail(admin.email, otpCode);
    
    logActivity(req.user.memberId, 'BACKUP_OTP_REQUESTED', `Requested OTP for database backup`);
    res.json({ message: 'Verification code sent to your email.' });
}));

// 2. GET Full Database Backup JSON (Superuser only, requires code query param)
router.get('/backup', authMiddleware, isSuperuser, asyncHandler(async (req, res) => {
    const { code } = req.query;
    const admin = await Member.findById(req.user.memberId);
    
    if (!code) {
        logActivity(req.user.memberId, 'BACKUP_FAILED', 'Attempted backup without OTP code');
        return res.status(400).json({ error: 'Verification code is required to download backup.' });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ email: admin.email, code });
    if (!otpRecord) {
        logActivity(req.user.memberId, 'BACKUP_FAILED', 'Attempted backup with invalid or expired OTP');
        return res.status(401).json({ error: 'Invalid or expired verification code.' });
    }

    // Consume OTP immediately
    await OTP.deleteMany({ email: admin.email });

    const backup = {
        members: await Member.find().select('-password').lean(),
        events: await Event.find().lean(),
        counters: await Counter.find().lean(),
        logs: await Log.find().lean(),
        announcements: await Announcement.find().lean(),
        certificates: await Certificate.find().lean(),
        eventCertificates: await EventCertificate.find().lean(),
        systemSettings: await SystemSetting.find().lean(),
        tasks: await Task.find().lean(),
        backupDate: new Date().toISOString(),
        version: "1.0"
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="Full_DB_Backup_${new Date().toISOString().split('T')[0]}.json"`);
    
    logActivity(req.user.memberId, 'SYSTEM_BACKUP', 'Full database snapshot downloaded successfully');
    res.json(backup);
}));

module.exports = router;
