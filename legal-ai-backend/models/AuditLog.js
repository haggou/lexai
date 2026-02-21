
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminName: { type: String, required: true }, // Snapshot of username
    action: { type: String, required: true }, // e.g., "UPDATE_CONFIG", "BAN_USER"
    target: { type: String }, // e.g., "User: 123", "System: Pricing"
    details: { type: Object }, // Changed data diff or description
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
