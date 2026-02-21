import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import morgan from 'morgan';
import compression from 'compression';
import { connectDB } from './config/db.js';

// Route Imports
import chatRoutes from './router/chatRoutes.js';
import authRoutes from './router/authRoutes.js';
import walletRoutes from './router/walletRoutes.js';
import subscriptionRoutes from './router/subscriptionRoutes.js';
import adminRoutes from './router/adminRoutes.js';
import userRoutes from './router/userRoutes.js';
import contentRoutes from './router/contentRoutes.js';
import contactRoutes from './router/contactRoutes.js';
import notificationRoutes from './router/notificationRoutes.js';
import sarvamRoutes from './router/sarvamRoutes.js';

// dotenv.config(); // Loaded via import 'dotenv/config'

const app = express();
const PORT = process.env.PORT || 3000;

// =========================================================================
// 1. GLOBAL MIDDLEWARE
// =========================================================================

// Enable Cross-Origin Resource Sharing
// In Production: restrictive CORS is better, e.g., origin: 'https://your-frontend.com'
app.use(cors({ origin: true, credentials: true })); // Allow all origins for dev compatibility

// Body Parsers
app.use(express.json({ limit: '50mb' })); // Limit body size to prevent DoS
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression (Gzip)
//app.use(compression());

// Logging (HTTP Request Logger)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined')); // Standard Apache combined log format for production
}

// =========================================================================
// 2. SECURITY LAYER
// =========================================================================
// Set Security Headers
// app.use(helmet());

// Prevent NoSQL Injection
// app.use(mongoSanitize());
// app.use(hpp());

// Rate Limiting
// Production: 1000 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        error: "Too many requests, please try again later."
    }
});
app.use('/api', limiter);

// Maintenance Mode Check
import { checkMaintenanceMode } from './middleware/maintenanceMiddleware.js';
app.use(checkMaintenanceMode);

// =========================================================================
// 3. ROUTES
// =========================================================================
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sarvam', sarvamRoutes);







// Health Check
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'active',
        message: 'Legal AI Backend Pro is running.',
        timestamp: new Date()
    });
});

// 404 Handler for undefined routes
app.use((req, res, next) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    err.status = 'fail';
    err.statusCode = 404;
    next(err);
});

// =========================================================================
// 4. GLOBAL ERROR HANDLER
// =========================================================================

app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log the error for server admin
    console.error('ERROR 💥:', err);

    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
});

// =========================================================================
// 5. SERVER START
// =========================================================================

import { createServer } from 'http';
import { initializeSocket } from './services/socketService.js';
import { setupLiveAvatarSocket } from './services/liveAvatarService.js';

// ... (existing imports) 

async function startServer() {
    try {
        await connectDB();

        // Create HTTP Server
        const httpServer = createServer(app);

        // Init Socket.IO
        const io = initializeSocket(httpServer);

        // Init Live Avatar (Native WS)
        setupLiveAvatarSocket(httpServer);

        // Listen
        httpServer.listen(PORT, () => {
            console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
            console.log(`➜  http://localhost:${PORT}`);
            console.log(`➜  Socket.IO Active\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
