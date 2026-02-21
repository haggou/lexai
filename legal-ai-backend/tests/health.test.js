import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const app = express();
app.get('/', (req, res) => {
    res.status(200).send('OK');
});

describe('Health Check', () => {
    it('should return 200 OK', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
    });
});
