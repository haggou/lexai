import LegalReport from '../models/LegalReport.js';
import { validationResult } from 'express-validator';

// Save a new report
export const saveReport = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { type, rawContent, structuredData, metadata, title } = req.body;
        const userId = req.user._id;

        const report = await LegalReport.create({
            userId,
            type,
            title: title || `${type === 'RISK_CHECK' ? 'Risk Audit' : 'Draft Analysis'} - ${new Date().toLocaleDateString()}`,
            rawContent,
            structuredData,
            metadata
        });

        res.status(201).json(report);
    } catch (error) {
        console.error("Save Report Error:", error);
        res.status(500).json({ error: "Failed to save report" });
    }
};

// Get list of reports (with filters)
export const getReports = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type, limit = 20 } = req.query;

        const query = { userId };
        if (type) query.type = type;

        const reports = await LegalReport.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json(reports.map(r => r.toDTO()));
    } catch (error) {
        console.error("Get Reports Error:", error);
        res.status(500).json({ error: "Failed to fetch reports" });
    }
};

// Get single full report
export const getReportById = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const report = await LegalReport.findOne({ _id: id, userId });
        if (!report) return res.status(404).json({ error: "Report not found" });

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch report details" });
    }
};

// Delete report
export const deleteReport = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        await LegalReport.deleteOne({ _id: id, userId });
        res.json({ message: "Report deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete report" });
    }
};
