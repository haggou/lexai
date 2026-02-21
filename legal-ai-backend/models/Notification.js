import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['FINANCIAL', 'LEGAL_UPDATE', 'SYSTEM', 'DRAFT', 'SECURITY', 'PROMO', 'OFFER'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    metadata: {
        type: Object, // Store related IDs (e.g., draftId, transactionId) or links
        default: {}
    },
    actions: [{
        label: String,
        link: String,
        primary: { type: Boolean, default: false }
    }],
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true // For sorting
    }
}, {
    timestamps: true
});

// TTL Index: Auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
