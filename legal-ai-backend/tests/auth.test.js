import { jest } from '@jest/globals';

// ------------------- MOCKS -------------------

// Mock DB
jest.unstable_mockModule('../config/db.js', () => ({
    connectDB: jest.fn(),
    getDB: jest.fn(() => ({
        collection: () => ({
            findOne: jest.fn(),
            insertOne: jest.fn(),
            updateOne: jest.fn(),
            createIndex: jest.fn()
        })
    }))
}));

// Mock Models
const mockUser = {
    _id: 'test_user_id',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashed_password_123', // "password123"
    walletBalance: 0,
    otp: '1234',
    otpExpires: Date.now() + 3600000
};

jest.unstable_mockModule('../models/User.js', () => ({
    default: {
        findByUsername: jest.fn((u) => u === 'existingUser' || u === 'testuser' ? mockUser : null),
        findByEmail: jest.fn((e) => e === 'existing@example.com' ? mockUser : null),
        findByMobile: jest.fn((m) => m === '9999999999' ? mockUser : null),
        create: jest.fn(() => ({ insertedId: 'new_user_id' })),
        updateOTP: jest.fn(),
        updatePassword: jest.fn()
    }
}));

// Mock Bcrypt
jest.unstable_mockModule('bcryptjs', () => ({
    default: {
        hash: jest.fn(() => 'hashed_password_123'),
        compare: jest.fn((pass, hash) => pass === 'password123' && hash === 'hashed_password_123')
    }
}));

// Mock JWT
jest.unstable_mockModule('jsonwebtoken', () => ({
    default: {
        sign: jest.fn(() => 'mock_jwt_token')
    }
}));

// Mock Nodemailer
jest.unstable_mockModule('nodemailer', () => ({
    default: {
        createTransport: jest.fn(() => ({
            sendMail: jest.fn().mockResolvedValue(true)
        }))
    }
}));

// ------------------- IMPORTS -------------------
const { describe, it, expect } = await import('@jest/globals');
const request = (await import('supertest')).default;
const express = (await import('express')).default;
const authRoutes = (await import('../router/authRoutes.js')).default;

// ------------------- APP SETUP -------------------
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// ------------------- TESTS -------------------
describe('Auth API - Industry Ready Tests', () => {

    describe('POST /api/auth/register', () => {
        it('should return 400 for validation errors (missing fields)', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser'
                    // Missing other required fields
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body.errors).toBeDefined(); // Now this should pass due to fix
        });

        it('should return 400 if user already exists', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'existingUser',
                    email: 'new@example.com',
                    password: 'password123',
                    mobile: '1234567890',
                    whatsapp: '1234567890',
                    profession: 'lawyer',
                    termsAgreed: 'true'
                });
            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });

        it('should return 201 on successful registration', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'newUser',
                    email: 'new@example.com',
                    password: 'password123',
                    mobile: '1234567890',
                    whatsapp: '1234567890',
                    profession: 'lawyer',
                    termsAgreed: 'true'
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('message', 'User registered successfully.');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should return 401 for invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'existingUser',
                    password: 'wrongpassword'
                });
            expect(res.statusCode).toBe(401);
        });

        it('should return 404 for non-existent user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'nonExistentUser',
                    password: 'password123'
                });
            expect(res.statusCode).toBe(404);
        });

        it('should return 200 and token for valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'existingUser',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.token).toBe('mock_jwt_token');
        });
    });

});
