const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  member_id: {
    type: String,
    unique: true,
    sparse: true, // sparse because it can be null initially
  },
  serial_number: {
    type: String,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  joining_year: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    enum: ['General', 'Executive', 'Admin', 'Superuser'],
    default: 'General',
    index: true,
  },
  requestedRole: {
    type: String,
    enum: ['General', 'Executive'],
    default: 'General',
  },
  referred_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'fee_pending', 'approved', 'blocked'],
    default: 'pending',
    index: true,
  },
  interview_called: {
    type: Boolean,
    default: false,
  },
  feeStatus: {
    type: String,
    enum: ['not_requested', 'requested', 'submitted', 'verified', 'waived'],
    default: 'not_requested',
  },
  feePayment: {
    transactionId: { type: String, default: '' },
    paymentChannel: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    screenshotUrl: { type: String, default: '' },
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: String, default: '' },
    waivedAt: { type: Date },
    waivedBy: { type: String, default: '' },
    waivedReason: { type: String, default: '' },
    amount: { type: Number },
  },
  profile_pic_url: {
    type: String,
  },
  certificate_url: {
    type: String,
  },
  father_name: {
    type: String,
  },
  whatsapp: {
    type: String,
  },
  education_level: {
    type: String,
    enum: ['Matric', 'Inter', 'Bachelor', 'Master', 'PhD', 'Other'],
  },
  program: {
    type: String,
  },
  passing_year: {
    type: String,
  },
  university: {
    type: String,
  },
  address: {
    type: String,
  },
  province: {
    type: String,
  },
  district: {
    type: String,
  },
  tehsil: {
    type: String,
  },
  city: {
    type: String,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  sls_official_id: { type: String, default: "" },
  cnic_number:     { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model('Member', memberSchema);
