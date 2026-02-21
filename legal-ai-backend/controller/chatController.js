
import { generateLegalResponse, streamLegalResponse, countTokens, verifyCitations, getDefaultModel, analyzeQuery } from '../services/aiService.js';
import { generatePDF } from '../services/pdfService.js';
import ChatModel from '../models/Chat.js';
import UserUsageModel from '../models/UserUsage.js';
import UserModel from '../models/User.js';
import TransactionModel from '../models/Transaction.js';
import LegalReport from '../models/LegalReport.js'; // Import LegalReport Model
import { buildRAGContext } from '../services/ragService.js';
import { getCache, setCache, getRedisClient } from '../config/redisClient.js';
import { validationResult } from 'express-validator';
import { notifyUser } from '../services/notificationService.js';
import { sarvamService } from '../services/sarvamai.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Helper: Process File with Sarvam AI
const processSarvamExtraction = async (file) => {
    if (!file || !file.buffer) return "";

    // Create Temp File
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `sarvam_temp_${Date.now()}_${file.originalname}`);

    try {
        fs.writeFileSync(tempFilePath, file.buffer);
        console.log(`[Sarvam] Processing file: ${tempFilePath}`);

        const extractedText = await sarvamService.extractText(tempFilePath);
        console.log(`[Sarvam] Extraction successful. Length: ${extractedText.length}`);

        return extractedText;
    } catch (error) {
        console.error("[Sarvam Extraction Failed]", error.message);
        return ""; // Fail silently, fallback to Gemini Vision
    } finally {
        // Cleanup
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    }
};

// Helper: Parse and Save Legal Report
const saveLegalReportFromResponse = async (userId, mode, rawContent, title = null) => {
    try {
        if (!['risk_check', 'draft_analysis'].includes(mode)) return;

        // Heuristic Parsing of AI Output
        let score = 0;
        let criticalCount = 0;
        let warningCount = 0;
        let citationCount = 0;
        let certaintyLevel = "Medium";

        // Regex for Score (e.g., "RISK SCORE (1-10): 8")
        const scoreMatch = rawContent.match(/(?:RISK SCORE|DRAFT SCORE|SCORE).*?(\d{1,2})\s*\/?\s*10/i);
        if (scoreMatch) score = parseInt(scoreMatch[1]);

        // Regex for Counts (Approximate)
        const criticalMatch = rawContent.match(/(?:Fixed|Fatal|Crucial|Critical).*?(\d+)/i);
        if (criticalMatch) criticalCount = parseInt(criticalMatch[1]);

        // Count specific bullet points or keywords for issues if no explicit count
        if (mode === 'risk_check' && !criticalMatch) {
            const fatalMatches = rawContent.match(/(- FATAL|- CRITICAL)/gi);
            if (fatalMatches) criticalCount = fatalMatches.length;
        }

        const warningMatch = rawContent.match(/(?:Warning|Improvement|Issue).*?(\d+)/i);
        if (warningMatch) warningCount = parseInt(warningMatch[1]);

        const citationMatch = rawContent.match(/(?:Citation|Case Law|Section).*?(\d+)/i);
        if (citationMatch) citationCount = parseInt(citationMatch[1]);

        // Certainty
        const certaintyMatch = rawContent.match(/(?:CERTAINTY LEVEL).*?(High|Medium|Low)/i);
        if (certaintyMatch) certaintyLevel = certaintyMatch[1];

        // Create Report
        console.log(`[LegalReport] Attempting to save ${mode} report...`);
        const report = await LegalReport.create({
            userId: userId,
            type: mode === 'risk_check' ? 'RISK_CHECK' : 'DRAFT_ANALYSIS',
            title: title || `${mode === 'risk_check' ? 'Risk Audit' : 'Draft Analysis'} - ${new Date().toLocaleString()}`,
            rawContent: rawContent,
            metadata: {
                score,
                criticalCount,
                warningCount,
                citationCount,
                certaintyLevel
            },
            structuredData: {
                parsedDate: new Date()
            }
        });
        console.log(`[LegalReport] Auto-saved report for ${mode} | ID: ${report._id}`);

    } catch (e) {
        console.error("[LegalReport] Failed to auto-save report:", e);
    }
};

// Helper: Clear History Cache
const invalidateUserHistory = async (userId) => {
    try {
        const client = await getRedisClient();
        if (client && client.isOpen) {
            const keys = await client.keys(`chat_history:${userId}:*`);
            if (keys.length > 0) await client.del(keys);
        }
    } catch (e) {
        console.error("Cache Invalidation Error:", e);
    }
};

// --- PRICING CONFIGURATION (INR Per Token) ---
// Note: Adjusted for budget-friendliness (based on Gemini 1.5 Flash market rates ~0.00003 INR, we set slightly higher for margin but low enough)
const DEFAULT_MODEL_PRICES = {
    'gemini-ultra': 0.0005,      // Premium
    'gemini-1.5-pro': 0.00025,   // Pro
    'gemini-1.5-flash': 0.00005, // Budget (Default)
    'gemini-flash-latest': 0.00005,
    'gemini-pro-latest': 0.00025,
    'default': 0.00005
};

const getModelPrices = async () => {
    try {
        const { default: SystemSetting } = await import('../models/SystemSetting.js');
        const setting = await SystemSetting.findOne({ key: 'model_pricing' });
        if (setting && setting.value) return setting.value;
    } catch (e) {
        console.warn("Pricing Config Fetch Failed, using default:", e);
    }
    return DEFAULT_MODEL_PRICES;
};

// --- CONTROLLERS ---

export const chat = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { message, model, language, mode, userId: bodyUserId } = req.body;
    const file = req.file;
    const currentMode = mode || "advice";

    // Sarvam AI Integration
    let augmentedMessage = message || "";
    if (file) {
        const extractedText = await processSarvamExtraction(file);
        if (extractedText) {
            augmentedMessage += `\n\n[DOCUMENT CONTENT (EXTRACTED BY SARVAM AI)]:\n${extractedText.substring(0, 30000)}`; // Token limit safety
        }
    }

    // Resolve Model (Dynamic Default)
    const currentModel = model || await getDefaultModel();

    // Use Authenticated User ID if present (Secure)
    let userId = bodyUserId;
    if (req.user) {
        userId = req.user._id.toString();
    }

    if (!message && !file) return res.status(400).json({ error: "Message or file is required" });

    // Check Feature Availability
    try {
        const { default: SystemSetting } = await import('../models/SystemSetting.js');
        const setting = await SystemSetting.findOne({ key: 'mode_pricing_config' });
        if (setting && setting.value) {
            const config = setting.value[currentMode];
            if (config && config.disabled) {
                return res.status(403).json({
                    error: `The '${currentMode}' feature is currently disabled by the administrator.`
                });
            }
        }
    } catch (e) {
        console.warn("Feature Check Failed:", e);
    }

    try {
        // 1. Balance Check
        let userUserObj = null;
        if (userId && userId !== "anonymous") {
            try {
                userUserObj = await UserModel.findById(userId);
                // Minimum Balance Rule: Must have at least ₹10
                if (userUserObj && userUserObj.walletBalance !== undefined && userUserObj.walletBalance < 10) {
                    return res.status(402).json({ error: "Insufficient balance. Minimum ₹10 required. Please recharge." });
                }
            } catch (uErr) {
                console.warn("User Balance Check Error:", uErr);
            }
        }

        // Cache Check (Skip for complex reqs)
        const cacheKey = `chat:${userId}:${model}:${currentMode}:${message}`;
        if (!file && currentMode !== 'draft') {
            const cached = await getCache(cacheKey);
            if (cached) {
                console.log("[Cache Hit] Serving cached response.");
                return res.json({ ...cached, cached: true });
            }
        }

        // 2. RAG Context
        let context = "";
        try {
            if (["advice", "compare"].includes(currentMode)) {
                context = await buildRAGContext(message);
            }
        } catch (err) {
            console.warn("[RAG] Failed to fetch context:", err.message);
        }

        // 3. History Fetch
        let historyContext = [];
        if (userId && userId !== "anonymous") {
            try {
                const recentChats = await ChatModel.getHistory(userId, 10, 0); // Increased context
                if (recentChats && recentChats.length > 0) {
                    recentChats.reverse().forEach(c => {
                        historyContext.push({
                            role: "user",
                            parts: [{ text: c.userMessage }]
                        });
                        historyContext.push({
                            role: "model",
                            parts: [{ text: c.aiResponse }]
                        });
                    });
                }
            } catch (histErr) {
                console.warn("[History] Failed to load:", histErr.message);
            }
        }

        // 4. GENERATION
        const responseText = await generateLegalResponse(
            `${augmentedMessage}\n${context}`,
            currentModel,
            file, // Pass the multer file object
            language,
            currentMode,
            historyContext
        );

        // 5. Post-Processing & Verification Tokens
        let verificationResult = "Skipped";
        let verificationTokens = 0;

        // Perform Verification (Hallucination Check) if explicitly requested OR advice mode
        if (currentMode === 'advice' || currentMode === 'hallucination_check') {
            const auditRes = await verifyCitations(responseText);
            // auditRes is now { text, tokens }
            verificationResult = typeof auditRes === 'object' ? auditRes.text : auditRes;
            verificationTokens = typeof auditRes === 'object' ? (auditRes.tokens || 0) : 0;
            verificationTokens = typeof auditRes === 'object' ? (auditRes.tokens || 0) : 0;
            console.log(`[Audit] Verification used ${verificationTokens} additional tokens.`);

            // NOTIFICATION TRIGGER: Accuracy Itch
            if (userId && userId !== 'anonymous' && verificationTokens > 0) {
                await notifyUser(
                    userId,
                    'SYSTEM',
                    'Satya-Check™ Completed',
                    'Your legal advice has been cross-verified against the Gazette of India.',
                    { mode: currentMode }
                );
            }
        }

        let pdfBase64 = null;
        if (currentMode === 'draft') {
            const pdfBuffer = await generatePDF(responseText, "Draft Document");
            pdfBase64 = pdfBuffer.toString('base64');
        }

        // 6. Billing & Stats
        const inputTokens = await countTokens(augmentedMessage || "");
        const outputTokens = await countTokens(responseText);
        const totalUsedTokens = inputTokens + outputTokens + verificationTokens; // Add Verification Cost

        // Calculate Cost
        // Calculate Cost
        // 1. Fetch Dynamic Configurations
        let modePricing = null;
        let modelBaseRates = null;
        try {
            const { default: SystemSetting } = await import('../models/SystemSetting.js');
            const modeSetting = await SystemSetting.findOne({ key: 'mode_pricing_config' });
            if (modeSetting && modeSetting.value) modePricing = modeSetting.value;

            const modelSetting = await SystemSetting.findOne({ key: 'model_pricing' });
            if (modelSetting && modelSetting.value) modelBaseRates = modelSetting.value;
        } catch (e) { console.warn("Pricing Config Fetch Failed", e); }

        let totalCost = 0;
        let pricingType = 'token'; // Default

        // Determine Base Rate for Model
        const safeBaseRate = (modelBaseRates && modelBaseRates[currentModel])
            ? parseFloat(modelBaseRates[currentModel])
            : 0.0001; // Default Fallback

        // 2. Calculate based on Mode Config
        if (modePricing && modePricing[currentMode] && !modePricing[currentMode].disabled) {
            const config = modePricing[currentMode];
            if (config.type === 'fixed') {
                // FIXED PRICE (Flat Fee)
                totalCost = parseFloat(config.price);
                pricingType = 'fixed';
                console.log(`[BILLING] Mode: ${currentMode} | Type: FIXED | Cost: ₹${totalCost}`);
            } else {
                // TOKEN PRICE (Base Rate * Multiplier)
                const multiplier = parseFloat(config.price) || 1.0;
                totalCost = totalUsedTokens * safeBaseRate * multiplier;
                pricingType = 'token_mode';
                console.log(`[BILLING] Mode: ${currentMode} | Type: TOKEN_MODE | Base: ${safeBaseRate} * Mult: ${multiplier} | Cost: ₹${totalCost}`);
            }
        } else {
            // 3. Fallback to Simple Model Pricing (Multiplier 1.0)
            totalCost = totalUsedTokens * safeBaseRate;
            console.log(`[BILLING] Mode: ${currentMode} | Type: DEFAULT_MODEL | Base: ${safeBaseRate} | Cost: ₹${totalCost}`);
        }

        console.log(`[VERIFY] User: ${userId}`);
        console.log(`[VERIFY] Usage: In=${inputTokens} Out=${outputTokens} Verify=${verificationTokens} | Total=${totalUsedTokens}`);
        console.log(`[VERIFY] Cost: ${totalUsedTokens} * ${pricePerToken} = ₹${totalCost.toFixed(6)}`);

        if (userId && userId !== "anonymous") {
            await UserModel.deductBalance(userId, totalCost);
            await UserUsageModel.updateUsage(userId, inputTokens, outputTokens + verificationTokens);

            // LOG TRANSACTION
            await TransactionModel.create({
                userId: userId,
                amount: totalCost,
                type: 'DEBIT',
                category: 'USAGE',
                description: `AI ${currentMode.toUpperCase()} (${model})`,
                metadata: {
                    model: model,
                    inputTokens: inputTokens,
                    outputTokens: outputTokens,
                    verificationTokens: verificationTokens,
                    mode: currentMode
                }
            });
        }

        // 7. Save to DB
        // Auto-Save specialized report if applicable
        if (userId && userId !== "anonymous") {
            await saveLegalReportFromResponse(userId, currentMode, responseText, (message || "File Analysis").substring(0, 50));
        }

        await ChatModel.create({
            userId: userId || "anonymous",
            userMessage: message || "[File Upload]",
            aiResponse: responseText,
            model: currentModel,
            language: language || "English",
            mode: currentMode,
            hasFile: !!file
        });

        if (userId && userId !== "anonymous") await invalidateUserHistory(userId);

        const finalBalance = userUserObj ? (userUserObj.walletBalance - totalCost) : "N/A";
        const finalResponse = {
            response: responseText,
            mode: currentMode,
            tokensDeducted: totalCost,
            remainingBalance: finalBalance,
            verification: verificationResult,
            pdfFile: pdfBase64,
            analysis: await analyzeQuery(message) // Expose futuristic metadata
        };

        // Cache Result
        if (!file && currentMode !== 'draft') {
            await setCache(cacheKey, finalResponse, 3600);
        }

        res.json(finalResponse);

    } catch (error) {
        console.error("Chat Controller Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const streamChat = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { message, model, mode, userId: bodyUserId, chatId } = req.body;
    const file = req.file; // Added for stream support
    const currentMode = mode || "advice";

    const currentModel = model || await getDefaultModel();

    // Use Authenticated User ID (Secure)
    let userId = bodyUserId;
    if (req.user) {
        userId = req.user._id.toString();
    }

    if (!message) return res.status(400).json({ error: "Message is required" });

    // Check Feature Availability
    try {
        const { default: SystemSetting } = await import('../models/SystemSetting.js');
        const setting = await SystemSetting.findOne({ key: 'mode_pricing_config' });
        if (setting && setting.value) {
            const config = setting.value[currentMode];
            if (config && config.disabled) {
                return res.status(403).json({
                    error: `The '${currentMode}' feature is currently disabled by the administrator.`
                });
            }
        }
    } catch (e) {
        console.warn("Feature Check Failed:", e);
    }

    // Initial Balance Check
    if (userId && userId !== "anonymous") {
        try {
            const user = await UserModel.findById(userId);
            // Minimum Balance Rule: Must have at least ₹10
            if (user && user.walletBalance !== undefined && user.walletBalance < 10) {
                return res.status(402).json({ error: "Insufficient balance. Minimum ₹10 required." });
            }
        } catch (uErr) { console.warn("Balance Check Error:", uErr); }
    }

    try {
        // --- SESSION LOGIC ---
        const { ObjectId } = await import('mongodb');
        const { default: ChatSessionModel } = await import('../models/ChatSession.js');
        const { generateSessionTitle } = await import('../services/aiService.js');

        let sessionId = null;
        let isNewSession = false;

        if (chatId && ObjectId.isValid(chatId)) {
            sessionId = chatId;
        } else if (userId && userId !== 'anonymous') {
            // Create New Session
            const newSessionId = await ChatSessionModel.create(userId, "New Conversation");
            sessionId = newSessionId.toString();
            isNewSession = true;
        }

        // Setup RAG
        let context = "";
        try {
            if (["advice", "compare"].includes(currentMode)) {
                context = await buildRAGContext(message);
            }
        } catch (e) { console.warn("[Stream RAG] Failed:", e.message); }

        // Fetch History
        let historyContext = [];
        if (userId && userId !== "anonymous") {
            try {
                // Fetch Recent Messages from THIS Session if exists, else generic recent
                let recentChats = [];
                if (sessionId && !isNewSession) {
                    recentChats = await ChatModel.getSessionMessages(sessionId);
                    // Take last 10
                    recentChats = recentChats.slice(-10);
                } else {
                    recentChats = await ChatModel.getHistory(userId, 5, 0); // Reduced generic context
                }

                if (recentChats && recentChats.length > 0) {
                    recentChats.forEach(c => { // Chronological
                        historyContext.push({ role: "user", parts: [{ text: c.userMessage }] });
                        historyContext.push({ role: "model", parts: [{ text: c.aiResponse }] });
                    });
                }
            } catch (histErr) { console.warn("[Stream History] Failed:", histErr.message); }
        }

        // Sarvam AI Integration (Stream)
        let finalMessage = message || "";
        if (file) {
            const extractedText = await processSarvamExtraction(file);
            if (extractedText) {
                finalMessage += `\n\n[DOCUMENT CONTENT (EXTRACTED BY SARVAM AI)]:\n${extractedText.substring(0, 30000)}`;
            }
        }

        const augmentedMessage = `${finalMessage}\n${context}`;

        // Initiate Stream
        const stream = await streamLegalResponse(augmentedMessage, currentModel, currentMode, historyContext, file);

        // Set Headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Send Session ID immediately
        if (isNewSession) {
            res.write(`data: ${JSON.stringify({ sessionId: sessionId, newSession: true })}\n\n`);
        } else if (sessionId) {
            res.write(`data: ${JSON.stringify({ sessionId: sessionId })}\n\n`);
        }

        // Send Analysis Metadata Event (Futuristic UX)
        const analysisData = await analyzeQuery(message);
        res.write(`event: analysis\ndata: ${JSON.stringify(analysisData)}\n\n`);

        let fullResponse = "";

        // Iterate Stream
        for await (const chunk of stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                fullResponse += chunkText;
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }

        // Finalize & Billing
        if (fullResponse) {
            await ChatModel.create({
                userId: userId || "anonymous",
                sessionId: sessionId,
                userMessage: message,
                aiResponse: fullResponse,
                model: model || "gemini-flash-latest",
                mode: currentMode
            });

            if (isNewSession && sessionId) {
                const title = await generateSessionTitle(message, fullResponse);
                await ChatSessionModel.updateTitle(sessionId, title);
            } else if (sessionId) {
                await ChatSessionModel.updateTimestamp(sessionId);
            }

            // Auto-Save specialized report if applicable (Stream Mode)
            if (userId && userId !== "anonymous") {
                await saveLegalReportFromResponse(
                    userId,
                    currentMode,
                    fullResponse,
                    isNewSession ? await generateSessionTitle(finalMessage || "File Analysis", fullResponse) : (finalMessage || "File Analysis").substring(0, 50)
                );
            }

            // 7b. Auto-Generate PDF for Drafts (Stream Mode)
            if (currentMode === 'draft') {
                try {
                    const pdfBuffer = await generatePDF(fullResponse, "Legal Draft");
                    const pdfBase64 = pdfBuffer.toString('base64');
                    const fileName = generateFileName(fullResponse);

                    res.write(`event: pdf\ndata: ${JSON.stringify({ file: pdfBase64, filename: fileName })}\n\n`);
                    console.log(`[Stream] Sent PDF: ${fileName}`);
                } catch (pdfErr) {
                    console.error("Stream PDF Gen Failed:", pdfErr);
                }
            }

            if (userId && userId !== "anonymous") {
                const iTokens = await countTokens(finalMessage);
                const oTokens = await countTokens(fullResponse);
                // Calculate Cost
                // Calculate Cost
                let modePricing = null;
                let modelBaseRates = null;
                try {
                    const { default: SystemSetting } = await import('../models/SystemSetting.js');
                    const modeSetting = await SystemSetting.findOne({ key: 'mode_pricing_config' });
                    if (modeSetting && modeSetting.value) modePricing = modeSetting.value;

                    const modelSetting = await SystemSetting.findOne({ key: 'model_pricing' });
                    if (modelSetting && modelSetting.value) modelBaseRates = modelSetting.value;
                } catch (e) { console.warn("Pricing Config Fetch Failed (Stream)", e); }

                let cost = 0;

                // Determine Base Rate
                const safeBaseRate = (modelBaseRates && modelBaseRates[currentModel])
                    ? parseFloat(modelBaseRates[currentModel])
                    : 0.0001;

                // Safety: Ensure numbers
                const safeInput = isNaN(iTokens) ? 0 : iTokens;
                const safeOutput = isNaN(oTokens) ? 0 : oTokens;
                const totalTokens = safeInput + safeOutput;

                if (modePricing && modePricing[currentMode] && !modePricing[currentMode].disabled) {
                    const config = modePricing[currentMode];
                    if (config.type === 'fixed') {
                        // Fixed Price
                        cost = parseFloat(config.price);
                    } else {
                        // Token Price (Base * Multiplier)
                        const multiplier = parseFloat(config.price) || 1.0;
                        cost = totalTokens * safeBaseRate * multiplier;
                    }
                } else {
                    // Fallback
                    cost = totalTokens * safeBaseRate;
                }


                // Deduct & Update
                await UserModel.deductBalance(userId, cost);
                await UserUsageModel.updateUsage(userId, safeInput, safeOutput);
                await invalidateUserHistory(userId);

                // Fetch updated balance for UI
                const updatedUser = await UserModel.findById(userId);

                // Log Transaction
                await TransactionModel.create({
                    userId: userId,
                    amount: cost,
                    type: 'DEBIT',
                    category: 'USAGE',
                    description: `AI Chat Stream (${model})`,
                    metadata: { inputTokens: iTokens, outputTokens: oTokens, mode: currentMode }
                });

                // Send Billing Event
                const billingData = {
                    cost: cost,
                    inTokens: iTokens,
                    outTokens: oTokens,
                    remainingBalance: updatedUser ? updatedUser.walletBalance : 0
                };
                res.write(`event: billing\ndata: ${JSON.stringify(billingData)}\n\n`);
                console.log(`[STREAM BILLING] Sent invoice: ₹${cost.toFixed(4)}`);

                // NOTIFICATION TRIGGER: Wallet Itch
                if (updatedUser && updatedUser.walletBalance < 10) {
                    await notifyUser(
                        userId,
                        'FINANCIAL',
                        'Low Wallet Balance',
                        `Your balance is low (₹${updatedUser.walletBalance.toFixed(2)}). Recharge now to avoid interruption.`,
                        { balance: updatedUser.walletBalance },
                        [{ label: 'Recharge Now', link: '/wallet', primary: true }]
                    );
                }
            }
        }

        res.write(`event: end\ndata: [DONE]\n\n`);
        res.end();

    } catch (error) {
        console.error("=== STREAMING ERROR ===", error.message);
        if (!res.headersSent) {
            console.error("!!! STREAM CONTROLLER ERROR !!!", error);
            return res.status(500).json({ error: `DEBUG: ${error.message || "Unknown Error"}` });
        } else {
            res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    }
};

// Helper to generate filename from content
const generateFileName = (content) => {
    try {
        // pattern: BETWEEN [Party A] AND [Party B]
        const betweenMatch = content.match(/BETWEEN\s+([^\n]+?)\s+(?:AND|&)\s+([^\n]+?)(?:\s+(?:AND|&)|$|\n|,|\()/i);

        if (betweenMatch) {
            const p1 = betweenMatch[1].replace(/['"]/g, '').trim().split(' ').slice(0, 2).join('_');
            const p2 = betweenMatch[2].replace(/['"]/g, '').trim().split(' ').slice(0, 2).join('_');
            // Sanitize
            const cleanP1 = p1.replace(/[^a-zA-Z0-9_]/g, '');
            const cleanP2 = p2.replace(/[^a-zA-Z0-9_]/g, '');
            return `Rent_Agreement_${cleanP1}_and_${cleanP2}.pdf`;
        }
    } catch (e) { console.warn("Filename Gen Failed", e); }
    return `Legal_Draft_${Date.now()}.pdf`;
};

export const getTokenUsage = async (req, res) => {
    let { userId } = req.params;

    // Security: Fix potential admin vulnerability or mismatch
    if (req.user) {
        // If "me" provided or normal use, use the token ID
        if (userId === 'me' || (req.user.role !== 'admin' && userId !== req.user._id.toString())) {
            userId = req.user._id.toString();
        }
    }

    if (!userId) return res.status(400).json({ error: "User ID is required" });

    try {
        const usage = await UserUsageModel.getUsage(userId);
        res.json(usage || {
            userId, totalInputTokens: 0, totalOutputTokens: 0, totalRequestCount: 0
        });
    } catch (error) {
        console.error("Get Usage Error:", error);
        res.status(500).json({ error: "Failed to fetch usage data" });
    }
};

export const getHistory = async (req, res) => {
    try {
        const { default: ChatSessionModel } = await import('../models/ChatSession.js');

        // Safe userId access
        const requestingUserId = req.user ? req.user._id.toString() : null;
        const targetUserId = (req.user?.role === 'admin' && req.query.userId) ? req.query.userId : requestingUserId;

        if (!targetUserId) throw new Error("User ID could not be determined.");

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const cacheKey = `chat_history_sessions:${targetUserId}:${page}:${limit}`;
        // Disable cache for now to ensure freshness during dev
        // const cached = await getCache(cacheKey);
        // if (cached) return res.json(cached);

        // Fetch Sessions
        const sessions = await ChatSessionModel.getSessions(targetUserId, limit, skip);

        const historyResponse = [];

        for (const session of sessions) {
            const msgs = await ChatModel.getSessionMessages(session._id);
            const formattedMessages = [];
            msgs.forEach(m => {
                formattedMessages.push({ role: 'user', content: m.userMessage, timestamp: m.timestamp });
                formattedMessages.push({ role: 'ai', content: m.aiResponse, timestamp: m.timestamp });
            });

            historyResponse.push({
                id: session._id,
                title: session.title,
                timestamp: session.updatedAt || session.createdAt,
                messages: formattedMessages
            });
        }

        // await setCache(cacheKey, historyResponse, 600);
        res.json(historyResponse);
    } catch (error) {
        console.error("Get History Error:", error);
        res.status(500).json({ error: "Failed to fetch chat history." });
    }
};

export const deleteChat = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id.toString();
        const result = await ChatModel.deleteMessage(id, userId);

        if (result.deletedCount === 0) return res.status(404).json({ error: "Chat message not found." });

        await invalidateUserHistory(userId);
        res.json({ message: "Chat message deleted." });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete chat." });
    }
};

export const clearChatHistory = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const result = await ChatModel.clearHistory(userId);
        await invalidateUserHistory(userId);
        res.json({ message: `History cleared. Removed ${result.deletedCount} messages.` });
    } catch (error) {
        res.status(500).json({ error: "Failed to clear history." });
    }
};
