const mongoose = require('mongoose');

const zoneField = {
  x: Number,
  y: Number,
  maxWidth: Number,
  maxHeight: Number,
  align: { type: String, default: 'center' },
  fontSize: { type: Number, default: 28 },
  color: { type: String, default: '#002147' },
  eraseColor: { type: String, default: '#F7F3EB' },
};

const CertTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  isActive: { type: Boolean, default: false },
  calibrated: { type: Boolean, default: false },
  zones: {
    name: { ...zoneField, fontSize: { type: Number, default: 64 } },
    date: { ...zoneField, align: { type: String, default: 'right' }, fontSize: { type: Number, default: 20 } },
    mobile: { ...zoneField, fontSize: { type: Number, default: 18 } },
    memberId: { ...zoneField, fontSize: { type: Number, default: 22 } },
    joiningYear: { ...zoneField, fontSize: { type: Number, default: 22 } },
    membershipStatus: { ...zoneField, fontSize: { type: Number, default: 20 } },
  },
  canvasWidth: { type: Number, default: 2048 },
  canvasHeight: { type: Number, default: 1436 },
});

module.exports = mongoose.model('CertTemplate', CertTemplateSchema);
