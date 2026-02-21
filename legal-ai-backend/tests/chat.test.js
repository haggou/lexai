import { jest } from '@jest/globals';

// 1. Mock Database
jest.unstable_mockModule('../config/db.js', () => ({
    connectDB: jest.fn(),
    getDB: jest.fn(() => ({
        collection: () => ({
            insertOne: jest.fn(),
            updateOne: jest.fn(),
            findOne: jest.fn(() => ({ walletBalance: 5000, _id: 'test_user_id' }))
        })
    }))
}));

// 2. Mock AI Service
jest.unstable_mockModule('../services/aiService.js', () => ({
    generateLegalResponse: jest.fn(() => "This is a MOCKED legal response for testing."),
    countTokens: jest.fn(() => 50),
    verifyCitations: jest.fn(() => "VERIFIED"),
    getEmbedding: jest.fn(() => [0.1, 0.2, 0.3]),
    streamLegalResponse: jest.fn() // Add if needed
}));

// 3. Mock Redis
jest.unstable_mockModule('../config/redisClient.js', () => ({
    getCache: jest.fn(() => null),
    setCache: jest.fn()
}));

// 4. Mock RAG Service
jest.unstable_mockModule('../services/ragService.js', () => ({
    buildRAGContext: jest.fn(() => " [MOCKED CONTEXT]")
}));

// 5. Mock PDF Service (added as it's used in controller)
jest.unstable_mockModule('../services/pdfService.js', () => ({
    generatePDF: jest.fn(() => Buffer.from("mock pdf"))
}));

// 6. Mock Models
jest.unstable_mockModule('../models/User.js', () => ({
    default: {
        findById: jest.fn(() => ({ walletBalance: 5000, subscriptionPlan: 'free' })),
        deductBalance: jest.fn(),
        updateBalance: jest.fn(),
        // Add other static methods if used
        findByUsername: jest.fn(),
        findByEmail: jest.fn(),
        findByMobile: jest.fn(),
        create: jest.fn(),
        updateOTP: jest.fn(),
        updatePassword: jest.fn()
    }
}));

jest.unstable_mockModule('../models/Chat.js', () => ({
    default: {
        create: jest.fn()
    }
}));

jest.unstable_mockModule('../models/UserUsage.js', () => ({
    default: {
        updateUsage: jest.fn(),
        getUsage: jest.fn()
    }
}));

// Imports
const { describe, it, expect } = await import('@jest/globals');
const request = (await import('supertest')).default;
const express = (await import('express')).default;
const chatRoutes = (await import('../router/chatRoutes.js')).default;

// Setup Express App for Testing
const app = express();
app.use(express.json());
app.use('/api', chatRoutes);

describe('Chat API Automated Tests', () => {

    it('POST /api/chat - Should return legal advice successfully', async () => {
        const res = await request(app)
            .post('/api/chat')
            .send({
                userId: "test_user_1",
                message: "What is Section 420?",
                mode: "advice"
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('response');
        expect(res.body.response).toBe("This is a MOCKED legal response for testing.");
        expect(res.body.verification).toBe("VERIFIED");
    });

    it('POST /api/chat - Should reject missing message', async () => {
        const res = await request(app)
            .post('/api/chat')
            .send({
                userId: "test_user_1"
                // message missing
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain("Message or file is required");
    });

});
