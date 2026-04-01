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
    // TTL Index: Auto-delete logs after 3 days (3 * 24 * 60 * 60 seconds)
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 259200
    }
}, { timestamps: true });

module.exports = mongoose.model('Log', LogSchema);
