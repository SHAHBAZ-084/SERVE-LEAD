const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Member = require('../models/Member');
const Event = require('../models/Event');
const Counter = require('../models/Counter');
const Log = require('../models/Log');
const Announcement = require('../models/Announcement');
const Certificate = require('../models/Certificate');
const EventCertificate = require('../models/EventCertificate');
const SystemSetting = require('../models/SystemSetting');
const Task = require('../models/Task');
const { sendWelcomeEmail, sendInterviewEmail } = require('../utils/emailService');
const authMiddleware = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const logActivity = require('../utils/activityLogger');
const { deleteFile } = require('../utils/storage');

// ── MIDDLEWARES ───────────────────────────────────────────

const isAdmin = asyncHandler(async (req, res, next) => {
    // authMiddleware already verified the token and put it in req.user
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Superuser')) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Administrative authority required.' });
    }
});

const isSuperuser = (req, res, next) => {
    if (req.user && req.user.role === 'Superuser') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Superuser authority required.' });
    }
};

// ── MEMBER MANAGEMENT ──────────────────────────────────────

// DELETE member (Admin only)
router.delete('/members/:id', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    try {
        const member = await Member.findById(req.params.id).lean();
        if (!member) {
            return res.status(404).json({ error: 'Application not found. It may have already been processed.' });
        }

        if (member.role === 'Superuser') {
            return res.status(403).json({ error: 'Critical Security: Superuser accounts cannot be deleted.' });
        }
        
        if (req.user.role === 'Admin' && member.role === 'Admin') {
            return res.status(403).json({ error: 'Access Denied: Admins cannot delete other administrative accounts.' });
        }

        // Delete associated files from storage
        if (member.profile_pic_url) await deleteFile(member.profile_pic_url);
        if (member.certificate_url) await deleteFile(member.certificate_url);

        await Member.deleteOne({ _id: req.params.id });
        await logActivity(req.user.memberId, 'DELETED_MEMBER', `Permanent removal: ${member.name} (${member.email})`, req.params.id);
        
        res.json({ message: 'Application and associated files deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to process deletion. Please try again.' });
    }
}));

// POST Bulk Delete members (Admin only)
router.post('/members/bulk-delete', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Invalid selection.' });

    const targetMembers = await Member.find({ _id: { $in: ids } }).lean();
    const deletableIds = targetMembers
        .filter(m => m.role !== 'Superuser' && (req.user.role === 'Superuser' || m.role !== 'Admin'))
        .map(m => m._id);

    if (deletableIds.length === 0) {
        return res.status(400).json({ error: 'No deletable applications found in selection.' });
    }

    // Delete files for all target members
    for (const m of targetMembers) {
        if (deletableIds.includes(m._id)) {
            if (m.profile_pic_url) await deleteFile(m.profile_pic_url);
            if (m.certificate_url) await deleteFile(m.certificate_url);
        }
    }

    await Member.deleteMany({ _id: { $in: deletableIds } });
    await logActivity(req.user.memberId, 'BULK_DELETE', `Mass removal of ${deletableIds.length} applications.`);
    
    res.json({ message: `Successfully removed ${deletableIds.length} records and associated files.` });
}));

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
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000
    });

    res.json({ token, username: member.name, is_superuser: member.role === 'Superuser' });
    logActivity(member._id, 'Login', `Logged into Admin Portal`);
}));

// GET Dashboard stats
router.get('/dashboard', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const [totalMembers, pendingMembers, totalAdmin, totalEvents, activeEvents] = await Promise.all([
        Member.countDocuments({ status: 'approved', role: 'General' }),
        Member.countDocuments({ status: 'pending' }),
        Member.countDocuments({ role: { $in: ['Admin', 'Superuser'] } }),
        Event.countDocuments(),
        Event.countDocuments({ is_active: true })
    ]);

    const resObj = {
        total_members: totalMembers,
        pending_members: pendingMembers,
        total_events: totalEvents,
        active_events: activeEvents,
    };

    if (req.user.role === 'Superuser') resObj.total_admins = totalAdmin;
    res.json(resObj);
}));

// GET all approved members (with pagination and search)
router.get('/members', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { search, page = 1, limit = 10 } = req.query;
    let query = { status: req.user.role === 'Superuser' ? { $in: ['approved', 'blocked'] } : 'approved' };
    
    if (req.user.role === 'Admin') query.role = { $nin: ['Admin', 'Superuser'] };
    if (search) {
        query.$or = [
            { name: new RegExp(search, 'i') },
            { member_id: new RegExp(search, 'i') }
        ];
    }

    const members = await Member.find(query)
        .select('-password')
        .sort({ createdAt: -1 }) // Sort by recent
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

    const count = await Member.countDocuments(query);
    res.json({ members, totalPages: Math.ceil(count / limit), currentPage: page });
}));

// GET all pending members
router.get('/pending-members', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const pending = await Member.find({ status: 'pending' })
        .select('-password')
        .sort({ createdAt: -1 })
        .lean();
    res.json(pending);
}));

// POST Approve member
router.post('/approve-member/:id', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (req.user.role === 'Admin' && (member.role === 'Admin' || member.role === 'Superuser')) {
        return res.status(403).json({ error: 'Permission denied.' });
    }

    if (member.status === 'approved') return res.status(400).json({ error: 'Already approved' });

    // ATOMIC ID GENERATION
    const year = member.joining_year || new Date().getFullYear();
    const counterId = `member_id_${year}`;
    const counter = await Counter.findByIdAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const nextMemberId = `${year}-SLS-${String(counter.seq).padStart(4, '0')}`;
    member.status = 'approved';
    member.member_id = nextMemberId;
    await member.save();

    sendWelcomeEmail(member.email, member.name, nextMemberId).catch(console.error);
    res.json({ message: 'Approved successfully', member_id: nextMemberId });
    logActivity(req.user.memberId, 'Approved Member', `Approved member: ${member.name} (${nextMemberId})`, member._id);
}));

// POST Call for interview
router.post('/interview-call/:id', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { venue, message } = req.body;
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    member.interview_called = true;
    await member.save();

    sendInterviewEmail(member.email, member.name, venue, message).catch(console.error);
    res.json({ message: 'Interview call sent successfully' });
    logActivity(req.user.memberId, 'Sent Interview Call', `Invited ${member.name} for interview at ${venue}`, member._id);
}));

// POST Register Admin/Member (SUPERUSER ONLY)
router.post('/members/add', authMiddleware, isSuperuser, asyncHandler(async (req, res) => {
    const { name, email, password, member_id, role, joining_year } = req.body;
    if (!name || !email || !password || !member_id) return res.status(400).json({ error: 'Missing fields' });

    const existing = await Member.findOne({ $or: [{ email: email.toLowerCase() }, { member_id }] });
    if (existing) return res.status(400).json({ error: 'Email or ID already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newMember = new Member({
        name, email: email.toLowerCase(), password: hashedPassword,
        member_id, role: role || 'Admin', joining_year, status: 'approved' 
    });

    await newMember.save();
    res.status(201).json({ message: 'Added successfully' });
    logActivity(req.user.memberId, 'Added Member/Admin', `Created new ${role || 'Admin'} account for ${name}`, newMember._id);
}));

// PATCH toggle member/admin block status
router.patch('/members/:id/toggle-block', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    
    if (member.role === 'Superuser') return res.status(403).json({ error: 'Cannot block superuser' });
    if (req.user.role === 'Admin' && member.role === 'Admin') return res.status(403).json({ error: 'Admins cannot block admins' });

    member.status = member.status === 'blocked' ? 'approved' : 'blocked';
    await member.save();
    res.json({ message: `Account ${member.status}`, status: member.status });
    logActivity(req.user.memberId, 'Toggled Account Status', `Changed status of ${member.name} to ${member.status}`, member._id);
}));

// PATCH Promote member to Admin (Superuser only)
router.patch('/members/:id/promote', authMiddleware, isSuperuser, asyncHandler(async (req, res) => {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    
    if (member.role === 'Admin' || member.role === 'Superuser') {
        return res.status(400).json({ error: 'User is already an administrator.' });
    }

    member.role = 'Admin';
    await member.save();
    res.json({ message: `${member.name} has been promoted to Admin.`, role: 'Admin' });
    logActivity(req.user.memberId, 'PROMOTED_ADMIN', `Promoted ${member.name} to Admin role`, member._id);
}));

// PATCH Demote Admin to General Member (Superuser only)
router.patch('/members/:id/demote', authMiddleware, isSuperuser, asyncHandler(async (req, res) => {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Administrator record not found' });
    
    if (member.role === 'Superuser') {
        return res.status(403).json({ error: 'Critical Security: Superuser status cannot be revoked.' });
    }

    member.role = 'General';
    await member.save();
    res.json({ message: `${member.name} access has been revoked.`, role: 'General' });
    logActivity(req.user.memberId, 'REVOKED_ADMIN', `Demoted ${member.name} back to General member`, member._id);
}));

// Profile and Logout routes...
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

router.post('/logout', (req, res) => {
    res.cookie('jwt', '', { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: new Date(0) 
    });
    res.json({ message: 'Logged out' });
});

// GET Logs Export CSV (Superuser only)
router.get('/logs/export', authMiddleware, isSuperuser, asyncHandler(async (req, res) => {
    const logs = await Log.find()
        .populate('target_id', 'name email')
        .sort({ createdAt: -1 })
        .lean();

    const headers = ['Timestamp', 'Administrator', 'Action', 'Details', 'Target'];
    const csvRows = [headers.join(',')];

    for (const log of logs) {
        let targetStr = '';
        if (log.target_id) {
            targetStr = log.target_id.name || log.target_id.email || log.target_id._id || log.target_id;
            targetStr = targetStr.toString().replace(/"/g, '""');
        }
        
        const detailsStr = (log.details || '').replace(/"/g, '""');
        
        const row = [
            `"${new Date(log.createdAt).toISOString()}"`,
            `"${log.admin_name || 'System'}"`,
            `"${log.action || ''}"`,
            `"${detailsStr}"`,
            `"${targetStr}"`
        ];
        csvRows.push(row.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="system_audit_logs.csv"');
    res.send(csvRows.join('\n'));
}));

// GET Logs (Superuser only)
router.get('/logs', authMiddleware, isSuperuser, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const logs = await Log.find()
        .populate('target_id', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
    
    const count = await Log.countDocuments();
    res.json({ logs, totalPages: Math.ceil(count / limit), currentPage: Number(page) });
}));

// GET Full Database Backup JSON (Superuser only)
router.get('/backup', authMiddleware, isSuperuser, asyncHandler(async (req, res) => {
    const backup = {
        members: await Member.find().lean(),
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
    res.json(backup);
    logActivity(req.user.memberId, 'SYSTEM_BACKUP', 'Full database snapshot downloaded');
}));

module.exports = router;

