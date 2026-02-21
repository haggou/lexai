
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // e.g., 'model_pricing', 'feature_flags'
    value: { type: mongoose.Schema.Types.Mixed, required: true }, // JSON object
    updatedAt: { type: Date, default: Date.now }
});

const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);

export default SystemSetting;
