const mongoose = require('mongoose');

const CertTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  isActive: { type: Boolean, default: false },
  calibrated: { type: Boolean, default: false },
  zones: {
    name: {
      x: Number,
      y: Number,
      maxWidth: Number,
      maxHeight: Number,
      align: { type: String, default: 'center' },
      fontSize: { type: Number, default: 90 },
      color: { type: String, default: '#ffffff' },
    },
    memberId: {
      x: Number,
      y: Number,
      maxWidth: Number,
      maxHeight: Number,
      align: { type: String, default: 'right' },
      fontSize: { type: Number, default: 28 },
      color: { type: String, default: '#ffffff' },
    },
    date: {
      x: Number,
      y: Number,
      maxWidth: Number,
      maxHeight: Number,
      align: { type: String, default: 'left' },
      fontSize: { type: Number, default: 28 },
      color: { type: String, default: '#ffffff' },
    },
    city: {
      x: Number,
      y: Number,
      maxWidth: Number,
      maxHeight: Number,
      align: { type: String, default: 'center' },
      fontSize: { type: Number, default: 22 },
      color: { type: String, default: '#ffffff' },
    },
  },
  canvasWidth: { type: Number, default: 2048 },
  canvasHeight: { type: Number, default: 1436 },
});

module.exports = mongoose.model('CertTemplate', CertTemplateSchema);
