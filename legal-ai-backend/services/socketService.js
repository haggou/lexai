import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { streamLegalResponse, countTokens } from './aiService.js';
import UserModel from '../models/User.js';
import TransactionModel from '../models/Transaction.js';
import UserUsageModel from '../models/UserUsage.js';
import SystemSetting from '../models/SystemSetting.js';

let io;

export const initializeSocket = async (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Redis Adapter Setup for Horizontal Scaling
    if (process.env.REDIS_URL) {
        try {
            const pubClient = createClient({ url: process.env.REDIS_URL });
            const subClient = pubClient.duplicate();

            await Promise.all([pubClient.connect(), subClient.connect()]);

            io.adapter(createAdapter(pubClient, subClient));
            console.log('✅ Socket.io Redis Adapter Connected');
        } catch (err) {
            console.error('❌ Redis Adapter Error:', err);
        }
    }

    io.on('connection', (socket) => {
        // console.log(`Socket Connected: ${socket.id}`);

        // --- Notification Rooms ---
        socket.on('join_notifications', (userId) => {
            if (userId) {
                const userRoom = `user_${userId}`;
                socket.join(userRoom);
                // console.log(`Socket ${socket.id} joined notification room: ${userRoom}`);
            }
        });

        socket.on('join_admin_feed', (role) => {
            if (role === 'admin' || role === 'super_admin') {
                socket.join('admin_pulse');
                // console.log(`Socket ${socket.id} joined ADMIN PULSE`);
            }
        });

        // --- Chat Functions ---
        socket.on('join_chat', (chatId) => {
            socket.join(chatId);
            // console.log(`Socket ${socket.id} joined chat ${chatId}`);
        });

        socket.on('ask_question', async (data) => {
            // data: { message, userId, chatId, mode, history }
            const { message, userId, chatId, mode, history } = data;

            try {
                // 1. Balance Check
                if (userId && userId !== 'anonymous') {
                    const user = await UserModel.findById(userId);
                    if (user && user.walletBalance < 2) { // Minimal check
                        socket.emit('ai_error', { chatId, error: "Insufficient Balance. Please recharge." });
                        return;
                    }
                }

                // Emit 'thinking' event
                socket.emit('ai_thinking', { chatId });

                // Start Stream
                const stream = await streamLegalResponse(message, null, mode, history || []);

                let fullText = "";

                for await (const chunk of stream) {
                    const chunkText = chunk.text();
                    fullText += chunkText;
                    socket.emit('ai_stream_chunk', {
                        chatId,
                        text: chunkText,
                        fullText: fullText
                    });
                }

                socket.emit('ai_stream_complete', {
                    chatId,
                    fullText: fullText,
                    mode: mode
                });

                // --- BILLING LOGIC ---
                // Calculate and deduct cost asynchronously
                if (userId && userId !== 'anonymous') {
                    (async () => {
                        try {
                            const iTokens = await countTokens(message);
                            const oTokens = await countTokens(fullText);
                            const totalTokens = iTokens + oTokens;

                            // Fetch Pricing
                            let modelBaseRates = null;
                            let modePricing = null;
                            try {
                                const modelSetting = await SystemSetting.findOne({ key: 'model_pricing' });
                                if (modelSetting?.value) modelBaseRates = modelSetting.value;

                                const modeSetting = await SystemSetting.findOne({ key: 'mode_pricing_config' });
                                if (modeSetting?.value) modePricing = modeSetting.value;
                            } catch (e) { }

                            // Calc Cost
                            const currentModel = 'gemini-flash-latest'; // Default used in socket
                            const safeBaseRate = (modelBaseRates && modelBaseRates[currentModel])
                                ? parseFloat(modelBaseRates[currentModel])
                                : 0.00005;

                            let cost = 0;
                            if (modePricing && modePricing[mode] && !modePricing[mode].disabled) {
                                const config = modePricing[mode];
                                if (config.type === 'fixed') {
                                    cost = parseFloat(config.price);
                                } else {
                                    const multiplier = parseFloat(config.price) || 1.0;
                                    cost = totalTokens * safeBaseRate * multiplier;
                                }
                            } else {
                                cost = totalTokens * safeBaseRate;
                            }

                            // Deduct
                            if (cost > 0) {
                                await UserModel.deductBalance(userId, cost);
                                await UserUsageModel.updateUsage(userId, iTokens, oTokens);

                                // Log
                                await TransactionModel.create({
                                    userId: userId,
                                    amount: cost,
                                    type: 'DEBIT',
                                    category: 'USAGE',
                                    description: `Voice/Socket Chat (${mode})`,
                                    metadata: { inputTokens: iTokens, outputTokens: oTokens, mode: mode }
                                });

                                // Send Billing Event to Frontend
                                const updatedUser = await UserModel.findById(userId);
                                socket.emit('event: billing', { // Use 'data' structure or similar if client expects stream style? No, socket uses explicit events.
                                    // Client usually listens for 'ai_billing' or we piggyback?
                                    // Let's emit a specific event.
                                    cost: cost,
                                    remainingBalance: updatedUser ? updatedUser.walletBalance : 0,
                                    inTokens: iTokens,
                                    outTokens: oTokens
                                });
                                // Also standard 'ai_billing'
                                socket.emit('ai_billing', {
                                    cost,
                                    remainingBalance: updatedUser ? updatedUser.walletBalance : 0
                                });
                            }
                        } catch (billErr) {
                            console.error("Socket Billing Error", billErr);
                        }
                    })();
                }

            } catch (error) {
                console.error("Socket AI Error:", error);
                socket.emit('ai_error', {
                    chatId,
                    error: error.message
                });
            }
        });

        socket.on('disconnect', () => {
            // console.log(`Socket Disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
