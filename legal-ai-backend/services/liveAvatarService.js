import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { parse } from 'url';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';
import TransactionModel from '../models/Transaction.js';
import SystemSetting from '../models/SystemSetting.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const setupLiveAvatarSocket = (server) => {
    const wss = new WebSocketServer({ server, path: '/live-avatar' });

    wss.on('connection', async (ws, req) => {
        // 1. Auth & Context
        const { query } = parse(req.url, true);
        let userId = null;
        let isAnonymous = true;

        console.log(`Live Avatar: Client connected.`);

        // SECURE AUTH: Verify Token
        if (query.token) {
            try {
                const decoded = jwt.verify(query.token, JWT_SECRET);
                if (decoded && decoded.userId) {
                    userId = decoded.userId;
                    isAnonymous = false;
                    console.log(`Live Avatar: Authenticated User=${userId}`);
                }
            } catch (err) {
                console.error("Live Avatar Auth Failed:", err.message);
                ws.send(JSON.stringify({ error: "Authentication Failed. Please login again." }));
                ws.close();
                return;
            }
        }

        let balanceInterval = null;
        const COST_PER_MINUTE = 2.00; // ₹2/min for Live Voice
        const DEDUCTION_INTERVAL = 15000; // Every 15s
        const COST_PER_TICK = (COST_PER_MINUTE / 60) * (DEDUCTION_INTERVAL / 1000);

        // Initial Balance Check
        if (!isAnonymous) {
            try {
                const user = await UserModel.findById(userId);
                if (!user || user.walletBalance < 2) {
                    ws.send(JSON.stringify({ error: "Insufficient Balance. Please recharge." }));
                    ws.close();
                    return;
                }
            } catch (e) { console.error("Auth Error", e); }
        }

        // 2. Billing Timer
        if (!isAnonymous) {
            balanceInterval = setInterval(async () => {
                try {
                    // Check & Deduct
                    const user = await UserModel.findById(userId);
                    if (!user || user.walletBalance < COST_PER_TICK) {
                        ws.send(JSON.stringify({ error: "Balance Depleted." }));
                        ws.close();
                        return;
                    }

                    await UserModel.deductBalance(userId, COST_PER_TICK);
                    // Standard usage update (time based not tokens) - Input 0, Output ? 
                    // Let's just track transaction
                    await TransactionModel.create({
                        userId,
                        amount: COST_PER_TICK,
                        type: 'DEBIT',
                        category: 'USAGE',
                        description: 'Voice Agent (Live)',
                        metadata: { durationSec: DEDUCTION_INTERVAL / 1000 }
                    });

                    // Send Billing Update
                    const updatedUser = await UserModel.findById(userId);
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'billing',
                            cost: COST_PER_TICK,
                            balance: updatedUser.walletBalance
                        }));
                    }
                } catch (err) {
                    console.error("Billing Tick Error", err);
                }
            }, DEDUCTION_INTERVAL);
        }

        // 3. Connect to Google Gemini Live
        const MODEL = "gemini-2.0-flash-exp";
        const API_KEY = process.env.GEMINI_API_KEY;
        const HOST = "generativelanguage.googleapis.com";
        const URI = `wss://${HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

        // Fetch System Prompt
        let systemInstruction = "You are a helpful Legal Assistant named Nyaya Mitra. Provide concise, accurate legal information for India.";
        try {
            const setting = await SystemSetting.findOne({ key: 'system_prompts' });
            if (setting && setting.value && setting.value.advice) {
                systemInstruction = setting.value.advice; // Use Advice Persona
            }
        } catch (e) { console.error("Error fetching system prompt:", e); }

        const googleWs = new WebSocket(URI);

        googleWs.on('open', () => {
            console.log("Connected to Gemini Live API");
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "status", message: "connected_upstream" }));
            }

            const setupMsg = {
                setup: {
                    model: `models/${MODEL}`,
                    generationConfig: {
                        responseModalities: ["AUDIO"],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } }
                        }
                    },
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    }
                }
            };
            googleWs.send(JSON.stringify(setupMsg));
            console.log("Sent Setup Message to Gemini");

            // Trigger Introduction
            setTimeout(() => {
                const intro = {
                    clientContent: {
                        turns: [
                            {
                                role: "user",
                                parts: [{ text: "Hello. Please briefly introduce yourself as Nyaya Mitra." }]
                            }
                        ],
                        turnComplete: true
                    }
                };
                googleWs.send(JSON.stringify(intro));
                console.log("Sent Introduction Trigger");
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "status", message: "ready" }));
                }
            }, 500);
        });

        googleWs.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.error) {
                    console.error("Gemini API Error:", msg.error);
                }
            } catch (e) { }

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });

        googleWs.on('error', (err) => {
            console.error("Google WS Error:", err);
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ error: "Upstream Error: " + err.message }));
        });

        googleWs.on('close', (code, reason) => {
            console.log(`Google WS Closed: ${code} - ${reason}`);
            if (ws.readyState === WebSocket.OPEN) ws.close();
        });

        // Keep-Alive
        const pingInterval = setInterval(() => {
            if (googleWs.readyState === WebSocket.OPEN) {
                // googleWs.ping(); // Optional, if upstream supports it. 
                // Instead, rely on WS level keep-alive if configured, or just trust the traffic.
            }
        }, 10000);

        ws.on('close', () => {
            console.log("Client Disconnected");
            clearInterval(pingInterval);
            if (balanceInterval) clearInterval(balanceInterval);
            if (googleWs.readyState === WebSocket.OPEN) googleWs.close();
        });

        // Handle Client Messages
        ws.on('message', (message) => {
            if (googleWs.readyState === WebSocket.OPEN) {
                googleWs.send(message);
            }
        });

        ws.on('close', () => {
            console.log("Client Disconnected");
            if (balanceInterval) clearInterval(balanceInterval);
            if (googleWs.readyState === WebSocket.OPEN) googleWs.close();
        });
    });

    console.log("Live Avatar WebSocket setup on /live-avatar");
};
