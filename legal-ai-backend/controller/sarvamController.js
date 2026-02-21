
import { sarvamService } from '../services/sarvamai.js';
import fs from 'fs';

export const analyzeDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please upload a file (PDF, JPG, PNG).'
            });
        }

        const filePath = req.file.path;
        const userQuery = req.body.query || "Analyze this document and provide key legal insights.";

        // Use Sarvam Service
        // This process might take time, so it's good to have loading state on frontend.
        const analysis = await sarvamService.adviseOnDocument(filePath, userQuery);

        // Send Response
        res.status(200).json({
            status: 'success',
            data: {
                advice: analysis.advice,
                extracted_text: analysis.documentText
            }
        });

        // Cleanup: remove uploaded file after processing?
        // Usually good practice, but maybe keep for debugging or caching.
        // For now, let's keep it or delete it.
        // fs.unlinkSync(filePath); // Uncomment to delete

    } catch (error) {
        console.error("Sarvam Analysis Error:", error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to analyze document.'
        });
    }
};
