const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const FeeRecord = require('../models/FeeRecord');
const SystemSetting = require('../models/SystemSetting');
const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/adminMiddlewares');
const asyncHandler = require('../middlewares/asyncHandler');
const { createUpload, getFileUrl } = require('../utils/storage');
const {
    sendFeeRequestedEmail,
    sendFeeRejectedEmail,
    sendFeeVerifiedEmail,
} = require('../utils/emailService');

const feeUpload = createUpload('fees', 8 * 1024 * 1024);

const getSettingValue = async (key, fallback = '') => {
    const doc = await SystemSetting.findOne({ key });
    return doc?.value ?? fallback;
};

const parseDonationChannels = (raw) => {
    try {
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const formatChannelLabel = (ch) => {
    if (!ch) return '';
    if (ch.type === 'Bank') {
        return `${ch.bankName || 'Bank'} — A/C: ${ch.accountNumber || 'N/A'}${ch.iban ? `, IBAN: ${ch.iban}` : ''}`;
    }
    return `${ch.walletType || 'Wallet'} — ${ch.number || 'N/A'}`;
};

const createFeeRecord = async ({
    member,
    admin,
    action,
    amount,
    paymentChannel = '',
    transactionId = '',
    screenshotUrl = '',
    note = '',
}) => FeeRecord.create({
    memberId: member._id,
    memberName: member.name,
    member_id_str: member.member_id || member.email,
    adminId: admin?._id,
    adminName: admin?.name || (action === 'fee_submitted' ? member.name : 'System'),
    action,
    amount,
    paymentChannel,
    transactionId,
    screenshotUrl,
    note,
});

const getAdminActor = async (req) => {
    const admin = await Member.findById(req.user.memberId).select('name member_id role');
    if (!admin) {
        const err = new Error('Admin account not found.');
        err.status = 404;
        throw err;
    }
    return admin;
};

// POST /api/fees/request/:memberId — Admin requests fee
router.post('/request/:memberId', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const member = await Member.findById(req.params.memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (!member.interview_called || member.status !== 'pending') {
        return res.status(400).json({ error: 'Fee can only be requested after interview has been called and while application is pending.' });
    }

    const amount = Number(await getSettingValue('membership_fee', '0')) || 0;
    const admin = await getAdminActor(req);

    member.feeStatus = 'requested';
    member.status = 'fee_pending';
    member.feePayment = member.feePayment || {};
    member.feePayment.amount = amount;
    await member.save();

    await createFeeRecord({ member, admin, action: 'fee_requested', amount });

    const channelsRaw = await getSettingValue('donation_channels', '[]');
    const channels = parseDonationChannels(channelsRaw);
    sendFeeRequestedEmail(member.email, member.name, amount, channels).catch(console.error);

    res.json({ message: 'Fee request sent', amount });
}));

// POST /api/fees/waive/:memberId — Admin grants free membership
router.post('/waive/:memberId', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { reason } = req.body;
    if (!reason?.trim() || reason.trim().length < 10) {
        return res.status(400).json({ error: 'A waiver reason of at least 10 characters is required.' });
    }

    const member = await Member.findById(req.params.memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (!member.interview_called || !['pending', 'fee_pending'].includes(member.status)) {
        return res.status(400).json({ error: 'Fee can only be waived after interview for pending applications.' });
    }

    const admin = await getAdminActor(req);
    member.feeStatus = 'waived';
    member.status = 'fee_pending';
    member.feePayment = member.feePayment || {};
    member.feePayment.waivedAt = new Date();
    member.feePayment.waivedBy = admin.member_id || admin._id.toString();
    member.feePayment.waivedReason = reason.trim();
    await member.save();

    await createFeeRecord({
        member,
        admin,
        action: 'fee_waived',
        amount: member.feePayment.amount,
        note: reason.trim(),
    });

    res.json({ message: 'Membership fee waived' });
}));

// POST /api/fees/submit — Member submits fee proof
router.post('/submit', authMiddleware, feeUpload.single('screenshot'), asyncHandler(async (req, res) => {
    const member = await Member.findById(req.user.memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (member._id.toString() !== String(req.user.memberId)) {
        return res.status(403).json({ error: 'Access denied.' });
    }

    if (member.feeStatus !== 'requested') {
        return res.status(400).json({ error: 'Fee proof can only be submitted when a fee has been requested.' });
    }

    const { transactionId, paymentChannel, accountNumber } = req.body;
    if (!transactionId?.trim()) return res.status(400).json({ error: 'Transaction ID is required.' });
    if (!paymentChannel?.trim()) return res.status(400).json({ error: 'Payment channel is required.' });
    if (!accountNumber?.trim()) return res.status(400).json({ error: 'Sender account or phone number is required.' });
    if (!req.file) return res.status(400).json({ error: 'Payment screenshot is required.' });

    const screenshotUrl = getFileUrl(req.file, 'fees');
    member.feePayment = member.feePayment || {};
    member.feePayment.transactionId = transactionId.trim();
    member.feePayment.paymentChannel = paymentChannel.trim();
    member.feePayment.accountNumber = accountNumber.trim();
    member.feePayment.screenshotUrl = screenshotUrl;
    member.feePayment.submittedAt = new Date();
    member.feeStatus = 'submitted';
    await member.save();

    await createFeeRecord({
        member,
        admin: null,
        action: 'fee_submitted',
        amount: member.feePayment.amount,
        paymentChannel: paymentChannel.trim(),
        transactionId: transactionId.trim(),
        screenshotUrl,
    });

    res.json({ message: 'Fee proof submitted. Awaiting admin verification.' });
}));

// POST /api/fees/verify/:memberId — Admin verifies fee
router.post('/verify/:memberId', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const member = await Member.findById(req.params.memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (!['submitted', 'waived'].includes(member.feeStatus)) {
        return res.status(400).json({ error: 'Only submitted or waived fee applications can be verified.' });
    }

    const admin = await getAdminActor(req);
    member.feePayment = member.feePayment || {};
    member.feePayment.verifiedAt = new Date();
    member.feePayment.verifiedBy = admin.member_id || admin._id.toString();
    member.feeStatus = 'verified';
    await member.save();

    await createFeeRecord({
        member,
        admin,
        action: 'fee_verified',
        amount: member.feePayment.amount,
        paymentChannel: member.feePayment.paymentChannel,
        transactionId: member.feePayment.transactionId,
        screenshotUrl: member.feePayment.screenshotUrl,
    });

    sendFeeVerifiedEmail(member.email, member.name).catch(console.error);

    res.json({ message: 'Fee verified. You can now approve this member.' });
}));

// POST /api/fees/reject/:memberId — Admin rejects fee submission
router.post('/reject/:memberId', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ error: 'Rejection reason is required.' });

    const member = await Member.findById(req.params.memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    if (member.feeStatus !== 'submitted') {
        return res.status(400).json({ error: 'Only submitted fee proofs can be rejected.' });
    }

    const admin = await getAdminActor(req);
    member.feeStatus = 'requested';
    await member.save();

    await createFeeRecord({
        member,
        admin,
        action: 'fee_rejected',
        amount: member.feePayment?.amount,
        paymentChannel: member.feePayment?.paymentChannel,
        transactionId: member.feePayment?.transactionId,
        screenshotUrl: member.feePayment?.screenshotUrl,
        note: reason.trim(),
    });

    sendFeeRejectedEmail(member.email, member.name, reason.trim()).catch(console.error);

    res.json({ message: 'Fee submission rejected. Member notified.' });
}));

// GET /api/fees/records — Admin fee audit log
router.get('/records', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    let { memberId, action, page = 1, limit = 20 } = req.query;
    page = parseInt(page, 10) || 1;
    limit = Math.min(parseInt(limit, 10) || 20, 100);

    const query = {};
    if (memberId) query.memberId = memberId;
    if (action) query.action = action;

    const [records, total] = await Promise.all([
        FeeRecord.find(query)
            .populate('memberId', 'name member_id email')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .lean(),
        FeeRecord.countDocuments(query),
    ]);

    res.json({
        records,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        currentPage: page,
    });
}));

// GET /api/fees/my-fee — Member own fee status
router.get('/my-fee', authMiddleware, asyncHandler(async (req, res) => {
    const member = await Member.findById(req.user.memberId).select('feeStatus feePayment status').lean();
    if (!member) return res.status(404).json({ error: 'Member not found' });

    res.json({
        feeStatus: member.feeStatus || 'not_requested',
        feePayment: member.feePayment || {},
        amount: member.feePayment?.amount ?? null,
        status: member.status,
    });
}));

module.exports = router;
