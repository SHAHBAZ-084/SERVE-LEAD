const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true
    },
    admin_name: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    target_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        default: null
    },
    // TTL Index: Auto-delete logs after 1 day (24 * 60 * 60 seconds)
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400
    }
}, { timestamps: true });

module.exports = mongoose.model('Log', LogSchema);
