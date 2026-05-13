const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  whatsappGroupLink: { type: String, default: "" },
  termsAndConditions: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
