import PortalModel from '../models/Portal.js';

// Fetch portals for a user
export const getUserPortals = async (req, res) => {
    try {
        const userId = req.params.id;
        const portals = await PortalModel.findByUserId(userId);
        res.json(portals);
    } catch (error) {
        console.error('Error fetching portals:', error);
        res.status(500).json({ error: 'Failed to fetch portals.' });
    }
};

// Add a new portal for a user
export const addUserPortal = async (req, res) => {
    try {
        const userId = req.params.id;
        const { title, path, description, category, name } = req.body; // Accept name for legacy/fallback

        const portalTitle = title || name;

        if (!portalTitle || !path) {
            return res.status(400).json({ error: 'Portal title and path (URL) are required.' });
        }

        const newPortal = await PortalModel.create({
            userId,
            title: portalTitle,
            path,
            description,
            category: category || 'personal'
        });

        res.status(201).json(newPortal);
    } catch (error) {
        console.error('Error adding portal:', error);
        res.status(500).json({ error: 'Failed to add portal.' });
    }
};

// Delete a portal
export const deleteUserPortal = async (req, res) => {
    try {
        const { id, portalId } = req.params;
        const result = await PortalModel.delete(portalId, id);

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Portal not found or not owned by user.' });
        }
        res.json({ message: 'Portal deleted successfully' });
    } catch (error) {
        console.error('Error deleting portal:', error);
        res.status(500).json({ error: 'Failed to delete portal.' });
    }
};