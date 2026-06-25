const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Member = require('../../models/Member');
const Event = require('../../models/Event');
const Counter = require('../../models/Counter');
const authMiddleware = require('../../middlewares/authMiddleware');
const asyncHandler = require('../../middlewares/asyncHandler');
const { isAdmin, isSuperuser } = require('../../middlewares/adminMiddlewares');
const { sendWelcomeEmail, sendInterviewEmail } = require('../../utils/emailService');
const logActivity = require('../../utils/activityLogger');
const { deleteFile } = require('../../utils/storage');

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
        
        // Remove from all event participants lists
        await Event.updateMany(
            {},
            { $pull: { participants: { memberId: req.params.id } } }
        );

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
    
    // Remove from all event participants lists in bulk
    await Event.updateMany(
        {},
        { $pull: { participants: { memberId: { $in: deletableIds } } } }
    );

    await logActivity(req.user.memberId, 'BULK_DELETE', `Mass removal of ${deletableIds.length} applications.`);
    
    res.json({ message: `Successfully removed ${deletableIds.length} records and associated files.` });
}));

// GET all approved members (with pagination and search)
router.get('/members', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    let { search, page = 1, limit = 10, city, role } = req.query;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    let query = { status: req.user.role === 'Superuser' ? { $in: ['approved', 'blocked'] } : 'approved' };
    
    if (req.user.role === 'Admin') query.role = { $nin: ['Admin', 'Superuser'] };
    if (search) {
        query.$or = [
            { name: new RegExp(search, 'i') },
            { member_id: new RegExp(search, 'i') }
        ];
    }
    if (city && city !== 'All Cities') {
        query.city = new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    }
    if (role && role !== 'All' && ['General', 'Executive'].includes(role)) {
        query.role = role;
    }

    const members = await Member.find(query)
        .select('-password')
        .sort({ createdAt: -1 }) // Sort by recent
        .limit(limit)
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
    const approvedRole =
        member.requestedRole === 'Executive' || (!member.requestedRole && member.role === 'Executive')
            ? 'Executive'
            : 'General';
    member.status = 'approved';
    member.role = approvedRole;
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

module.exports = router;
