import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const protect = async (req, res, next) => {
    console.log('[AUTH] Starting authentication check...');
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        console.log('[AUTH] Token found in header');
    }

    if (!token) {
        console.log('[AUTH] No token found - rejecting');
        return res.status(401).json({ error: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('[AUTH] Token verified for user:', decoded.userId);
        const user = await UserModel.findById(decoded.userId);

        if (!user) {
            console.log('[AUTH] User not found in database');
            return res.status(401).json({ error: 'Not authorized, user not found' });
        }

        console.log('[AUTH] User authenticated successfully:', user.email);
        req.user = user;
        next();
    } catch (error) {
        console.error("[AUTH] Token verification failed:", error.message);
        res.status(401).json({ error: 'Not authorized, token failed' });
    }
};

export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied: insufficient permissions' });
        }
        next();
    };
};
