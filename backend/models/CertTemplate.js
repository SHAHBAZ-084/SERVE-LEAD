const mongoose = require('mongoose');

const CertTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  isActive: { type: Boolean, default: false },
  calibrated: { type: Boolean, default: false },
  /** membership = auto for all members; general = used when admin issues awards */
  kind: {
    type: String,
    enum: ['membership', 'general'],
    default: 'general',
  },
  isDeleted: { type: Boolean, default: false, index: true },
  zones: { type: mongoose.Schema.Types.Mixed, default: {} },
  canvasWidth: { type: Number, default: 2048 },
  canvasHeight: { type: Number, default: 1436 },
});

module.exports = mongoose.model('CertTemplate', CertTemplateSchema);
