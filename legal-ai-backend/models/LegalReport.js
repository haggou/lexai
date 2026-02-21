import mongoose from 'mongoose';

const legalReportSchema = new mongoose.Schema({
    userId: {
        type: String, // Changed from ObjectId to String to support Demo Users/Anonymous
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['RISK_CHECK', 'DRAFT_ANALYSIS'],
        required: true
    },
    title: {
        type: String,
        default: 'Untitled Report'
    },
    rawContent: {
        type: String,
        required: true
    }, // The full markdown output from AI
    structuredData: {
        type: mongoose.Schema.Types.Mixed
    }, // The parsed JSON (score, risks, etc.)
    metadata: {
        score: Number,
        criticalCount: Number,
        warningCount: Number,
        citationCount: Number,
        certaintyLevel: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: -1
    }
});

// Method to sanitize/format for frontend
legalReportSchema.methods.toDTO = function () {
    return {
        id: this._id,
        type: this.type,
        title: this.title,
        date: this.createdAt,
        score: this.metadata?.score || 0,
        summary: this.type === 'RISK_CHECK'
            ? `${this.metadata?.criticalCount || 0} Critical, ${this.metadata?.warningCount || 0} Warnings`
            : `${this.metadata?.citationCount || 0} Citations • ${this.metadata?.certaintyLevel || 'N/A'}`
    };
};

const LegalReport = mongoose.model('LegalReport', legalReportSchema);

export default LegalReport;
