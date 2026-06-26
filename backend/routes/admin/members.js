const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Member = require('../../models/Member');
const Event = require('../../models/Event');
const Counter = require('../../models/Counter');
const FeeRecord = require('../../models/FeeRecord');
const ExecutiveApplication = require('../../models/ExecutiveApplication');
const SystemSetting = require('../../models/SystemSetting');
const authMiddleware = require('../../middlewares/authMiddleware');
const asyncHandler = require('../../middlewares/asyncHandler');
const { isAdmin, isSuperuser } = require('../../middlewares/adminMiddlewares');
const { sendWelcomeEmail, sendInterviewEmail, sendInterviewPassedEmail, sendInterviewFailedEmail, sendExecutiveApprovedEmail, sendExecutiveRejectedEmail } = require('../../utils/emailService');
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
    let { search, page = 1, limit = 10, province, district, tehsil, city, role } = req.query;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactRegex = (s) => new RegExp(`^${escapeRegex(s)}$`, 'i');
    const isActiveFilter = (value, allLabel) => value && value !== allLabel;

    let query = { status: req.user.role === 'Superuser' ? { $in: ['approved', 'blocked'] } : 'approved' };
    
    if (req.user.role === 'Admin') query.role = { $nin: ['Admin', 'Superuser'] };
    if (search) {
        query.$or = [
            { name: new RegExp(search, 'i') },
            { member_id: new RegExp(search, 'i') }
        ];
    }
    const filterTehsil = isActiveFilter(tehsil, 'All Tehsils')
        ? tehsil
        : (city && city !== 'All Cities' && city !== 'All Tehsils' ? city : null);

    if (isActiveFilter(province, 'All Provinces')) {
        query.$and = query.$and || [];
        query.$and.push({ province: exactRegex(province) });
    }
    if (isActiveFilter(district, 'All Districts')) {
        query.$and = query.$and || [];
        query.$and.push({ district: exactRegex(district) });
    }
    if (filterTehsil) {
        query.$and = query.$and || [];
        query.$and.push({ $or: [{ tehsil: exactRegex(filterTehsil) }, { city: exactRegex(filterTehsil) }] });
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

// GET all pending members + executive upgrade applications
router.get('/pending-members', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const [members, executiveApplications] = await Promise.all([
        Member.find({ status: { $in: ['pending', 'fee_pending'] } })
            .select('-password')
            .sort({ createdAt: -1 })
            .lean(),
        ExecutiveApplication.find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .populate('memberId', 'name email member_id city')
            .lean(),
    ]);
    res.json({ members, executiveApplications });
}));

const finalizeMemberApproval = async (member) => {
    const perRequestMonths = member.feePayment?.validityMonths;
    const validityDoc = await SystemSetting.findOne({ key: 'membership_validity_months' });
    const defaultMonths = parseInt(validityDoc?.value, 10) || 12;
    const validityMonths = (perRequestMonths && perRequestMonths > 0) ? perRequestMonths : defaultMonths;
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + validityMonths);

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
    member.membershipValidUntil = validUntil;
    await member.save();

    sendWelcomeEmail(member.email, member.name, nextMemberId, validUntil).catch(console.error);
    return { nextMemberId, validUntil };
};

// POST Approve member
router.post('/approve-member/:id', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (req.user.role === 'Admin' && (member.role === 'Admin' || member.role === 'Superuser')) {
        return res.status(403).json({ error: 'Permission denied.' });
    }

    if (member.status === 'approved') return res.status(400).json({ error: 'Already approved' });

    const allowedFeeStatuses = ['verified', 'waived'];
    if (!allowedFeeStatuses.includes(member.feeStatus || 'not_requested')) {
        return res.status(400).json({
            error: 'Cannot approve. The member\'s fee is not yet verified. Please verify their payment or waive the fee before approving.',
        });
    }

    if (member.interviewResult?.status !== 'passed') {
        return res.status(400).json({
            error: 'Cannot approve. The member must pass the interview before membership approval.',
        });
    }

    if (!['pending', 'fee_pending'].includes(member.status)) {
        return res.status(400).json({ error: 'Member is not in a pending approval state.' });
    }

    const { nextMemberId } = await finalizeMemberApproval(member);
    res.json({ message: 'Approved successfully', member_id: nextMemberId });
    logActivity(req.user.memberId, 'Approved Member', `Approved member: ${member.name} (${nextMemberId})`, member._id);
}));

// POST Direct approve — after passed interview, skip fee collection and approve immediately
router.post('/direct-approve/:id', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { note } = req.body;
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (req.user.role === 'Admin' && (member.role === 'Admin' || member.role === 'Superuser')) {
        return res.status(403).json({ error: 'Permission denied.' });
    }

    if (member.status === 'approved') return res.status(400).json({ error: 'Already approved' });

    if (member.interviewResult?.status !== 'passed') {
        return res.status(400).json({
            error: 'Direct approval requires a passed interview.',
        });
    }

    if (!['pending', 'fee_pending'].includes(member.status)) {
        return res.status(400).json({ error: 'Member is not in a pending approval state.' });
    }

    const admin = await Member.findById(req.user.memberId).select('name member_id');
    const waiverReason = (note?.trim() || 'Direct membership approval — fee waived by administration').slice(0, 500);

    if (!['verified', 'waived'].includes(member.feeStatus || 'not_requested')) {
        member.feeStatus = 'waived';
        member.feePayment = member.feePayment || {};
        member.feePayment.waivedAt = new Date();
        member.feePayment.waivedBy = admin?.member_id || admin?._id?.toString() || '';
        member.feePayment.waivedReason = waiverReason;
        await member.save();

        await FeeRecord.create({
            memberId: member._id,
            memberName: member.name,
            recordType: 'membership_fee',
            action: 'fee_waived',
            amount: member.feePayment.amount,
            note: waiverReason,
            adminId: admin?._id,
            adminName: admin?.name || 'Admin',
        });
    }

    const { nextMemberId } = await finalizeMemberApproval(member);
    res.json({ message: 'Member approved directly without fee collection', member_id: nextMemberId });
    logActivity(req.user.memberId, 'Direct Approved Member', `Direct approved ${member.name} (${nextMemberId})`, member._id);
}));

// POST Call for interview
router.post('/interview-call/:id', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { venue, message, dressCode, arrivalTime, guideNotes, focusAreas, linkUrl } = req.body;
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    if (member.status === 'rejected') return res.status(400).json({ error: 'This application has been closed.' });

    member.interview_called = true;
    member.interviewDetails = {
        venue: venue?.trim() || '',
        message: message?.trim() || '',
        dressCode: dressCode?.trim() || '',
        arrivalTime: arrivalTime?.trim() || '',
        guideNotes: guideNotes?.trim() || '',
        focusAreas: focusAreas?.trim() || '',
        linkUrl: linkUrl?.trim() || '',
    };
    if (!member.interviewResult?.status || member.interviewResult.status === 'pending') {
        member.interviewResult = { status: 'pending', note: '', updatedAt: null, updatedBy: '' };
    }
    await member.save();

    sendInterviewEmail(member.email, member.name, member.interviewDetails).catch(console.error);
    res.json({ message: 'Interview call sent successfully' });
    logActivity(req.user.memberId, 'Sent Interview Call', `Invited ${member.name} for interview at ${venue}`, member._id);
}));

// POST Record interview result
router.post('/interview-result/:id', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { result, note } = req.body;
    if (!['passed', 'failed'].includes(result)) {
        return res.status(400).json({ error: 'Result must be passed or failed.' });
    }
    if (!note?.trim() || note.trim().length < 5) {
        return res.status(400).json({ error: 'A note of at least 5 characters is required.' });
    }

    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    if (!member.interview_called) {
        return res.status(400).json({ error: 'Interview must be called before recording a result.' });
    }

    const admin = await Member.findById(req.user.memberId).select('name member_id');
    member.interviewResult = {
        status: result,
        note: note.trim(),
        updatedAt: new Date(),
        updatedBy: admin?.member_id || admin?._id?.toString() || '',
    };

    if (result === 'failed') {
        member.status = 'rejected';
        await member.save();
        sendInterviewFailedEmail(member.email, member.name, note.trim()).catch(console.error);
        logActivity(req.user.memberId, 'Interview Failed', `Marked ${member.name} as failed interview`, member._id);
        return res.json({ message: 'Interview marked as failed. Candidate notified.' });
    }

    await member.save();
    sendInterviewPassedEmail(member.email, member.name, note.trim()).catch(console.error);
    logActivity(req.user.memberId, 'Interview Passed', `Marked ${member.name} as passed interview`, member._id);
    res.json({ message: 'Interview marked as passed. You may now request membership fee.' });
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

// GET pending executive upgrade applications
router.get('/executive-applications', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const applications = await ExecutiveApplication.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .populate('memberId', 'name email member_id city')
        .lean();

    res.json(applications);
}));

// POST approve executive application
router.post('/executive-applications/:id/approve', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const application = await ExecutiveApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found.' });
    if (application.status !== 'pending') {
        return res.status(400).json({ error: 'This application has already been reviewed.' });
    }

    const admin = await Member.findById(req.user.memberId).select('name member_id');
    const member = await Member.findById(application.memberId);
    if (!member) return res.status(404).json({ error: 'Linked member not found.' });

    application.status = 'approved';
    application.reviewedAt = new Date();
    application.reviewedBy = admin?.name || admin?.member_id || 'Admin';

    member.role = 'Executive';

    await application.save();
    await member.save();

    sendExecutiveApprovedEmail(member.email, member.name).catch(console.error);
    logActivity(req.user.memberId, 'Executive Approved', `Approved executive application for ${member.name}`, member._id);

    res.json({ message: 'Executive application approved' });
}));

// POST reject executive application
router.post('/executive-applications/:id/reject', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { reason } = req.body;
    if (!reason?.trim() || reason.trim().length < 10) {
        return res.status(400).json({ error: 'Rejection reason must be at least 10 characters.' });
    }

    const application = await ExecutiveApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found.' });
    if (application.status !== 'pending') {
        return res.status(400).json({ error: 'This application has already been reviewed.' });
    }

    const admin = await Member.findById(req.user.memberId).select('name member_id');
    const member = await Member.findById(application.memberId);

    application.status = 'rejected';
    application.reviewedAt = new Date();
    application.reviewedBy = admin?.name || admin?.member_id || 'Admin';
    application.rejectionReason = reason.trim();
    await application.save();

    if (member) {
        sendExecutiveRejectedEmail(member.email, member.name, reason.trim()).catch(console.error);
    }

    logActivity(req.user.memberId, 'Executive Rejected', `Rejected executive application for ${application.memberName}`, application.memberId);
    res.json({ message: 'Application rejected' });
}));

module.exports = router;
