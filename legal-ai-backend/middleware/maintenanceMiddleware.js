
import SystemSetting from '../models/SystemSetting.js';

let isMaintenance = false;

// Refresh maintenance status every 30 seconds to avoid DB hit every request
// or can just accept DB hit for robust consistency. Let's do DB hit for immediate kill switch.
export const checkMaintenanceMode = async (req, res, next) => {
    // 1. Bypass for Admin/Auth routes (so admins can login to fix things)
    if (req.originalUrl.startsWith('/api/admin') || req.originalUrl.startsWith('/api/auth')) {
        return next();
    }

    // 2. Check DB
    try {
        // Optimization: In real prod, cache this value in memory/redis and invalidate on update.
        // For now, simple DB query.
        const setting = await SystemSetting.findOne({ key: 'system_status' });
        if (setting && setting.value === 'maintenance') {
            return res.status(503).json({
                error: "System Under Maintenance",
                message: "We are currently upgrading the system. Please try again in a few minutes.",
                maintenance: true
            });
        }
    } catch (e) {
        console.error("Maintenance Check Error:", e);
    }

    next();
};
