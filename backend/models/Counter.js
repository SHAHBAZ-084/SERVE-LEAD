const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // e.g. "member_id_2026"
    seq: { type: Number, default: 99 } // IDs start at 100
});

module.exports = mongoose.model('Counter', counterSchema);
