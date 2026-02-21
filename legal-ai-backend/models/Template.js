
import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true }, // e.g., 'Contracts', 'Notices', 'Affidavits'
    description: { type: String },
    content: { type: String, required: true }, // Markdown or standardized text with {{variables}}
    tags: [{ type: String }],
    isPremium: { type: Boolean, default: false },
    variables: [{ // Dynamic fields to ask user
        name: { type: String }, // e.g., 'rent_amount'
        label: { type: String }, // e.g., 'Monthly Rent'
        type: { type: String, default: 'text' } // text, date, number
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Template = mongoose.model('Template', templateSchema);
export default Template;
