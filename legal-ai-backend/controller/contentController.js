
import Template from '../models/Template.js';

// --- Templates ---
export const getTemplates = async (req, res) => {
    try {
        const templates = await Template.find().sort({ title: 1 });
        res.json(templates);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch templates" });
    }
};

export const createTemplate = async (req, res) => {
    try {
        const template = await Template.create({
            ...req.body,
            createdBy: req.user._id
        });
        res.status(201).json(template);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const deleteTemplate = async (req, res) => {
    try {
        await Template.findByIdAndDelete(req.params.id);
        res.json({ message: "Template deleted" });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete" });
    }
};

export const updateTemplate = async (req, res) => {
    try {
        const updated = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: "Failed to update" }); }
};
