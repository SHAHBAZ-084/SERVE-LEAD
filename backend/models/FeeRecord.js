const mongoose = require('mongoose');

const feeRecordSchema = new mongoose.Schema({
  recordType: {
    type: String,
    enum: ['membership_fee', 'donation'],
    default: 'membership_fee',
    index: true,
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    sparse: true,
    index: true,
  },
  memberName: { type: String, default: '' },
  member_id_str: { type: String, default: '' },
  donorName: { type: String, default: '' },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  adminName: { type: String, default: '' },
  action: {
    type: String,
    enum: [
      'fee_requested', 'fee_submitted', 'fee_verified', 'fee_rejected', 'fee_waived',
      'donation_received',
    ],
    required: true,
  },
  amount: { type: Number },
  paymentChannel: { type: String, default: '' },
  transactionId: { type: String, default: '' },
  screenshotUrl: { type: String, default: '' },
  note: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('FeeRecord', feeRecordSchema);
