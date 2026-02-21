import { jest } from '@jest/globals';

// ------------------- MOCKS -------------------
jest.unstable_mockModule('../config/db.js', () => ({
    connectDB: jest.fn(),
    getDB: jest.fn()
}));

const mockUser = {
    _id: 'test_user_id',
    walletBalance: 1000
};

jest.unstable_mockModule('../models/User.js', () => ({
    default: {
        findById: jest.fn((id) => id === 'test_user_id' ? mockUser : null),
        updateBalance: jest.fn()
    }
}));

// Mock Razorpay
const mockRazorpayInstance = {
    orders: {
        create: jest.fn(() => Promise.resolve({
            id: 'order_123456',
            entity: 'order',
            amount: 50000,
            currency: 'INR',
            receipt: 'receipt_123'
        }))
    }
};

jest.unstable_mockModule('razorpay', () => ({
    default: jest.fn(() => mockRazorpayInstance)
}));

// Mock Crypto must be real
// const crypto = await import('node:crypto');

// ------------------- IMPORTS -------------------
const { describe, it, expect } = await import('@jest/globals');
const request = (await import('supertest')).default;
const express = (await import('express')).default;
const walletRoutes = (await import('../router/walletRoutes.js')).default;
const crypto = (await import('node:crypto')).default; // Use real crypto

// ------------------- APP SETUP -------------------
const app = express();
app.use(express.json());
app.use('/api/wallet', walletRoutes);

// ------------------- TESTS -------------------
describe('Wallet API Tests', () => {

    describe('POST /create-order', () => {
        it('should create an order successfully', async () => {
            const res = await request(app)
                .post('/api/wallet/create-order')
                .send({
                    amount: 500, // INR
                    currency: 'INR'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('id', 'order_123456');
            expect(res.body).toHaveProperty('amount', 50000); // Razorpay expects paisa
        });

        it('should fail with invalid amount', async () => {
            const res = await request(app)
                .post('/api/wallet/create-order')
                .send({
                    amount: -100
                });
            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });
    });

    describe('POST /verify-payment', () => {
        // We set env vars for the test run context within the test
        process.env.RAZORPAY_KEY_SECRET = 'test_secret';

        it('should verify payment successfully with valid signature', async () => {
            const orderId = 'order_123456';
            const paymentId = 'pay_123456';
            const signature = crypto.createHmac('sha256', 'test_secret')
                .update(orderId + "|" + paymentId)
                .digest('hex');

            const res = await request(app)
                .post('/api/wallet/verify-payment')
                .send({
                    razorpay_order_id: orderId,
                    razorpay_payment_id: paymentId,
                    razorpay_signature: signature,
                    userId: 'test_user_id',
                    amount: 500
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success'); // Checked controller, it implies status: success
        });

        it('should reject payment with invalid signature', async () => {
            const res = await request(app)
                .post('/api/wallet/verify-payment')
                .send({
                    razorpay_order_id: 'order_123',
                    razorpay_payment_id: 'pay_123',
                    razorpay_signature: 'invalid_sig',
                    userId: 'test_user_id',
                    amount: 500
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /balance/:userId', () => {
        it('should return user balance', async () => {
            const res = await request(app)
                .get('/api/wallet/balance/test_user_id');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('balance', 1000);
        });

        it('should return 404 for unknown user', async () => {
            const res = await request(app)
                .get('/api/wallet/balance/unknown_user');

            // Controller: if (!user) return res.status(404)
            expect(res.statusCode).toBe(404);
        });
    });

});
