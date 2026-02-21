
import { GoogleGenerativeAI } from "@google/generative-ai";
import { VertexAI } from '@google-cloud/vertexai';
import dotenv from 'dotenv';
import SystemSetting from '../models/SystemSetting.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// --- CONFIGURATION ---
const LEX_CONFIG = {
    DEFAULT_MODEL_FALLBACK: "gemini-flash-latest", // Primary efficient model (Stable)
    TEMP_ADVICE: 0.2, // Low creativity for accuracy
    TEMP_DRAFT: 0.1,  // Very low creativity for documents
    TRANSITION_DATE: new Date("2024-07-01"),
};

// ... (lines 16-373 skipped)

// ... (lines 383-431 skipped)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to fetch Dynamic Default Model
export const getDefaultModel = async () => {
    try {
        const setting = await SystemSetting.findOne({ key: 'DEFAULT_MODEL' });
        return setting?.value || LEX_CONFIG.DEFAULT_MODEL_FALLBACK;
    } catch (e) {
        return LEX_CONFIG.DEFAULT_MODEL_FALLBACK;
    }
};

// Vertex AI Client (Lazy Config)
let vertexClient = null;
const getVertexClient = () => {
    if (!vertexClient && process.env.GOOGLE_CLOUD_PROJECT) {
        vertexClient = new VertexAI({
            project: process.env.GOOGLE_CLOUD_PROJECT,
            location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
        });
    }
    return vertexClient;
};

const isVertexEnabled = async () => {
    try {
        if (!process.env.GOOGLE_CLOUD_PROJECT) return false;
        const setting = await SystemSetting.findOne({ key: 'VERTEX_ENABLED' });
        return setting?.value === true;
    } catch (e) { return false; }
};

// --- SYSTEM ARCHITECTURE PROMPTS ---
// --- SYSTEM ARCHITECTURE PROMPTS ---
const loadPrompt = (filename) => {
    try {
        return fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
    } catch (e) {
        console.warn(`Warning: Could not load system prompt ${filename}. Using empty string.`, e);
        return "";
    }
};

const DEFAULT_PROMPTS = {
    advice: loadPrompt('advice.md'),
    draft: loadPrompt('gemini draft.md'),
    risk_check: loadPrompt('risk check.md'),
    draft_analysis: loadPrompt('draft analyse.md'),
    compare: `# SYSTEM PROMPT: NYAYA-TULNA (COMPARATIVE LEGAL ANALYST)

## 1. CORE IDENTITY
You are "Nyaya-Tulna," an intelligent Legal Comparison Engine. Your sole purpose is to analyze distinctions, conflicts, and evolutions between two legal concepts, statutes, or case laws—specifically focusing on the transition from IPC/CrPC/IEA to BNS/BNSS/BSA (2025 Era).

## 2. COMPARISON STRUCTURE (MANDATORY)
Every response must be a structured comparative analysis:

### A. THE CORE CONFLICT
- Briefly state what is being compared (e.g., "Section 420 IPC vs Section 318 BNS").

### B. COMPARISON TABLE (KEY DIFFERENCES)
| Feature/Aspect | OLD LAW (IPC/CrPC) | NEW LAW (BNS/BNSS) | IMPACT |
| :--- | :--- | :--- | :--- |
| **Section** | Sec 420 (Cheating) | Sec 318 (Cheating) | Renumbered |
| **Punishment** | Up to 7 Years | Up to 7 Years | No Change |
| **Key Change** | "Dishonest Induction" | "Dishonest Induction" | Definition Streamlined |

### C. DETAILED ANALYSIS
- **Evolution:** Why was the change made? (e.g., "To decolonize language" or "To include digital frauds").
- **Procedure:** How does the procedure change for the police or court?
- **Burden of Proof:** Has it shifted?

### D. CASE LAW IMPLICATIONS
- Will old judgments (Pre-2024) still apply?
- Cite relevant transitional provisions (Section 358 BNS etc.).

## 3. SPECIAL INSTRUCTIONS
- Use **Markdown Tables** for all direct comparisons.
- Be precise with Section numbers.
- Highlight "Game Changers" (e.g., Community Service introduced in BNS).

## 4. DISCLAIMER
"This comparison is for analytical purposes. For active cases, verify with the latest Gazette notifications."
    `,
    hallucination_check: `SYSTEM PROMPT: SATYA-CHECK (LEGAL FACT CHECKER)
    - You are an Auditor API.
    - Your job is to verify every Legal Section, Case Law, and Act citation in the provided text.
    - If a citation is FAKE or MISQUOTED, correct it.
    - If true, mark as Verified.
    - OUTPUT: A structured report of "Claimed vs Actual" facts.`
};

// Helper to fetch dynamic prompts with fallback
const getSystemPrompts = async () => {
    try {
        const setting = await SystemSetting.findOne({ key: 'system_prompts' });
        if (setting && setting.value) {
            return { ...DEFAULT_PROMPTS, ...setting.value };
        }
    } catch (e) {
        console.warn("Failed to fetch dynamic prompts, using defaults.");
    }
    return DEFAULT_PROMPTS;
};

// --- UTILITIES ---

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * RESILIENCE LAYER: executeWithRetry
 * Handles Rate Limits (429), Server Errors (5xx), and Model Not Found.
 * Supports fallback models if primary fails completely.
 */
const executeWithRetry = async (operation, maxRetries = 3, fallbackModels = []) => {
    let lastError;

    // 1. Try Primary with Retries
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            const isRateLimit = error.status === 429 || (error.message && error.message.includes('429'));
            const isServerErr = error.status >= 500;
            const isModelNotFound = error.status === 404 || (error.message && (error.message.includes('404') || error.message.toLowerCase().includes('not found')));

            if (isRateLimit || isServerErr) {
                const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000; // Exponential Backoff + Jitter
                console.warn(`[AI Resilience] Attempt ${i + 1} failed.Retrying in ${Math.round(waitTime)}ms...Error: ${error.message} `);
                await delay(waitTime);
            } else if (isModelNotFound) {
                console.warn(`[AI Resilience] Model not found: ${error.message}. Switching to fallback...`);
                break; // Exit retry loop to switch to fallback immediately
            } else {
                // Non-retriable error (e.g., 400 Bad Request)
                throw error;
            }
        }
    }

    // 2. Try Fallbacks (if defined)
    if (fallbackModels.length > 0) {
        console.warn(`[AI Resilience] Primary model exhausted.Switching to fallback: ${fallbackModels[0].name} `);
        return await executeWithRetry(
            () => fallbackModels[0].operation(),
            2, // Fewer retries for fallbacks
            fallbackModels.slice(1) // Remaining fallbacks
        );
    }

    throw lastError;
};

/**
 * LAYER 2: INTENT & ERA & EXPERTISE DETECTION
 * "Futuristic UX Thinking" from advice.md:
 * - User intent detection
 * - Beginner vs expert tone adaptation
 * - Risk scoring mindset
 */
export const analyzeQuery = (prompt) => {
    const p = prompt ? prompt.toLowerCase() : "";

    // 1. Era Detection
    const isNewEra = p.includes("2025") || p.includes("2024") || new Date() > LEX_CONFIG.TRANSITION_DATE;

    // 2. Mode Detection (Heuristic Fallback)
    let mode = "advice";
    if (/draft|prepare|generate|write|create agreement|make a deed/i.test(p)) mode = "draft";
    else if (/compare|difference between|versus|vs/i.test(p)) mode = "compare";
    else if (/check risk|audit|review|analyze/i.test(p)) mode = "risk_check";

    // 3. Granular Intent Detection
    let primaryIntent = "GENERAL_ADVICE";
    if (/(bail|arrest|police|fir|court|judge|anticipatory|warrant|custody|remand)/i.test(p)) primaryIntent = "LITIGATION_DEFENSE";
    else if (/(contract|agreement|nda|mou|sale deed|lease|employment|bond)/i.test(p)) primaryIntent = "CONTRACTUAL";
    else if (/(compliance|audit|filing|tax|gst|return|incorporation|registration)/i.test(p)) primaryIntent = "CORPORATE_COMPLIANCE";
    else if (/(property|land|tenant|eviction|rent|possession|encumbrance)/i.test(p)) primaryIntent = "PROPERTY_DISPUTE";
    else if (/(divorce|maintenance|custody|marriage|dowry|dv act)/i.test(p)) primaryIntent = "FAMILY_LAW";
    else if (/(cheque|bounce|138|payment|fraud|scam|cyber)/i.test(p)) primaryIntent = "FINANCIAL_CRIME";

    // 4. User Expertise/Tone Detection
    // Lawyers use section numbers, specific latin terms, or procedural codes.
    // Laypeople use emotional words or general terms.
    let userExpertise = "LAYPERSON";
    const legalJargon = [
        "u/s", "section", "article", "writ", "petitioner", "respondent",
        "jurisprudence", "locus standi", "sub-judice", "cognizable",
        "bailable", "non-bailable", "decree", "injunction", "quashing",
        "impugned", "appellant", "maintainability"
    ];
    // Check if at least 2 unique jargon terms are present
    const jargonCount = legalJargon.filter(term => p.includes(term)).length;
    if (jargonCount >= 2) userExpertise = "LEGAL_PROFESSIONAL";

    // 5. Urgency Detection
    let urgency = "NORMAL";
    if (/(urgent|emergency|immediately|arrested now|police at door|help asap|suicide|threat)/i.test(p)) urgency = "HIGH_CRITICAL";

    return {
        mode,
        era: isNewEra ? "POST-JULY 2024 (BNS/BNSS/BSA)" : "PRE-JULY 2024 (IPC/CrPC/IEA)",
        intent: primaryIntent,
        userExpertise,
        urgency
    };
};

/**
 * LAYER 1 (Optional): STATUTORY AUDITOR
 * Verifies sections. Disabled by default to save tokens/latency.
 */
const auditLegalResponse = async (text) => {
    try {
        const auditor = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            systemInstruction: "Verify Indian Legal Sections. Return corrected text."
        });
        const result = await auditor.generateContent(`AUDIT THIS: \n${text} `);
        const responseText = result.response.text();
        const { totalTokens } = await auditor.countTokens(`AUDIT THIS: \n${text} ` + responseText);

        return { text: responseText, tokens: totalTokens || 0 };
    } catch (e) {
        return { text: text, tokens: 0 }; // Return original on failure
    }
};

// --- CORE EXPORTS ---

// Helper to fetch Mode-Specific AI Config (Temperature, etc.)
const getInferenceConfig = async () => {
    try {
        const setting = await SystemSetting.findOne({ key: 'mode_inference_config' });
        if (setting && setting.value) return setting.value;
    } catch (e) {
        console.warn("Failed to fetch inference config, using defaults.");
    }
    return {};
};

// --- CORE EXPORTS ---

export const generateLexAI = async (inputContent, history = [], requestedModel = null, explicitMode = null) => {
    // Extract text for analysis
    let textForAnalysis = "";
    if (Array.isArray(inputContent)) {
        textForAnalysis = inputContent.find(p => p.text)?.text || "";
    } else {
        textForAnalysis = inputContent;
    }

    const analysis = analyzeQuery(textForAnalysis);
    const mode = explicitMode || analysis.mode;
    const era = analysis.era;
    const { intent, userExpertise, urgency } = analysis;

    // Fetch Dynamic Configs
    const inferenceConfig = await getInferenceConfig();
    const modeSettings = inferenceConfig[mode] || {};

    // Resolve Model: 
    // 1. Explicit request
    // 2. Mode-specific default (if configured)
    // 3. System-wide default
    let resolvedModel = requestedModel;
    if (!resolvedModel && modeSettings.model && modeSettings.model !== 'default') {
        resolvedModel = modeSettings.model;
    }
    if (!resolvedModel) {
        resolvedModel = await getDefaultModel();
    }

    // Determine Temperature
    // Default: Advice=0.2, Draft=0.1
    let temperature = modeSettings.temperature !== undefined
        ? parseFloat(modeSettings.temperature)
        : (mode === "draft" ? LEX_CONFIG.TEMP_DRAFT : LEX_CONFIG.TEMP_ADVICE);

    const useVertex = await isVertexEnabled();
    const vertexClientInstance = useVertex ? getVertexClient() : null;

    const performGeneration = async (modelName) => {
        const prompts = await getSystemPrompts(); // FETCH DYNAMIC PROMPTS

        const isLegacyModel = modelName.includes("gemini-pro") && !modelName.includes("1.5");
        const modelConfig = {
            model: modelName,
            generationConfig: { temperature: temperature }
        };

        // --- VERTEX AI PATH ---
        if (vertexClientInstance) {
            const systemInst = prompts[mode] || prompts['advice'];
            const vertexModel = vertexClientInstance.getGenerativeModel({
                ...modelConfig,
                systemInstruction: { parts: [{ text: systemInst }] }
            });

            let messageToSend = inputContent;
            if (typeof inputContent === 'string') {
                // INJECT CONTEXT
                const contextHeader = `[METADATA]\n- ERA: ${era}\n- DETECTED INTENT: ${intent}\n- USER TYPE: ${userExpertise}\n- URGENCY: ${urgency}\n\n`;
                messageToSend = `${contextHeader}[USER REQUEST]:\n${inputContent}`;
            }

            const chatSession = vertexModel.startChat({
                history: history,
                generationConfig: modelConfig.generationConfig
            });

            const result = await chatSession.sendMessage(messageToSend);
            const response = await result.response;
            if (response.candidates && response.candidates[0] && response.candidates[0].content) {
                return response.candidates[0].content.parts.map(p => p.text).join('');
            }
            return "";
        }

        // --- GOOGLE AI STUDIO PATH ---
        if (!isLegacyModel) {
            modelConfig.systemInstruction = prompts[mode] || prompts['advice'];
        }

        const model = genAI.getGenerativeModel(modelConfig);

        // Prepare Message
        let messageToSend = inputContent;
        if (typeof inputContent === 'string') {
            // INJECT CONTEXT
            const contextHeader = `[METADATA]\n- ERA: ${era}\n- DETECTED INTENT: ${intent}\n- USER TYPE: ${userExpertise}\n- URGENCY: ${urgency}\n\n`;
            messageToSend = `${contextHeader}[USER REQUEST]:\n${inputContent}`;
        }

        if (!isLegacyModel) {
            const chatSession = model.startChat({
                history: history,
                generationConfig: modelConfig.generationConfig
            });
            const result = await chatSession.sendMessage(messageToSend);
            return result.response.text();
        } else {
            // Legacy/Fallback
            const historyText = history.map(h => `${h.role === 'user' ? 'USER' : 'MODEL'}: ${h.parts[0].text}`).join('\n');
            let promptText = typeof messageToSend === 'string' ? messageToSend : textForAnalysis;
            const simplePrompt = `${prompts[mode] || prompts['advice']}\n\n[HISTORY]\n${historyText}\n\n[REQUEST]\n${promptText}`;

            const result = await model.generateContent(
                Array.isArray(messageToSend) ? messageToSend : simplePrompt
            );
            return result.response.text();
        }
    };

    // Fallback Chain
    // Fallback Chain
    const fallbackChain = [
        { name: "gemini-2.0-flash", operation: () => performGeneration("gemini-2.0-flash") },
        { name: "gemini-2.5-flash", operation: () => performGeneration("gemini-2.5-flash") },
        { name: "gemini-pro-latest", operation: () => performGeneration("gemini-pro-latest") }
    ];

    try {
        let initialText = await executeWithRetry(
            () => performGeneration(resolvedModel),
            2,
            fallbackChain
        );

        // --- POST-PROCESSING: STRIP MARKDOWN FROM DRAFTS ---
        if (mode === "draft") {
            // Remove double asterisks (Bolding)
            initialText = initialText.replace(/\*\*/g, '');
            // Optional: Remove single asterisks if they are being used for italics
            initialText = initialText.replace(/\*/g, '');
            // Optional: Remove backticks
            initialText = initialText.replace(/`/g, '');
        }

        return initialText;
    } catch (finalError) {
        console.error("[AI CRITICAL FAILURE]", finalError);
        throw new Error(`LexAI Service Unavailable. Please try again later. Original Error: ${finalError.message}`);
    }
};

/**
 * STREAM LEGAL RESPONSE
 * Returns a generative stream.
 */
export const streamLegalResponse = async (prompt, modelName = null, mode = "advice", history = [], fileObj = null) => {
    // Fetch Dynamic Configs
    const inferenceConfig = await getInferenceConfig();
    const modeSettings = inferenceConfig[mode] || {};

    // Resolve Model
    let resolvedModel = modelName;
    if (!resolvedModel && modeSettings.model && modeSettings.model !== 'default') {
        resolvedModel = modeSettings.model;
    }
    if (!resolvedModel) {
        resolvedModel = await getDefaultModel();
    }

    const { era, intent, userExpertise, urgency } = analyzeQuery(prompt);

    // Determine Temperature
    let temperature = modeSettings.temperature !== undefined
        ? parseFloat(modeSettings.temperature)
        : (mode === "draft" ? LEX_CONFIG.TEMP_DRAFT : LEX_CONFIG.TEMP_ADVICE);

    const performStream = async (targetModel) => {
        const prompts = await getSystemPrompts();

        const isLegacyModel = targetModel.includes("gemini-pro") && !targetModel.includes("1.5");
        const modelConfig = {
            model: targetModel,
            generationConfig: { temperature: temperature }
        };

        if (!isLegacyModel) {
            modelConfig.systemInstruction = prompts[mode] || prompts['advice'];
        }

        const model = genAI.getGenerativeModel(modelConfig);

        const augmentedPrompt = `[METADATA]\n- ERA: ${era}\n- DETECTED INTENT: ${intent}\n- USER TYPE: ${userExpertise}\n- URGENCY: ${urgency}\n\n[USER REQUEST]: ${prompt}`;

        // Map History for Gemini (Standardize)
        const geminiHistory = history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: h.parts ? h.parts : [{ text: h.content || "" }]
        }));

        if (!isLegacyModel) {
            const chatSession = model.startChat({
                history: geminiHistory,
                generationConfig: { temperature: temperature }
            });

            let messageParts = [augmentedPrompt];
            if (fileObj && fileObj.buffer && fileObj.mimetype) {
                messageParts.push({
                    inlineData: {
                        data: fileObj.buffer.toString('base64'),
                        mimeType: fileObj.mimetype
                    }
                });
            }

            const result = await chatSession.sendMessageStream(messageParts);

            if (mode === "draft") {
                return (async function* () {
                    for await (const chunk of result.stream) {
                        const originalText = chunk.text();
                        const cleanedText = originalText.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '');
                        yield {
                            text: () => cleanedText
                        };
                    }
                })();
            }

            return result.stream;
        } else {
            // Legacy/Fallback (No image support in legacy stream usually, or strictly text)
            const historyText = geminiHistory.map(h => `${h.role === 'user' ? 'USER' : 'MODEL'}: ${h.parts[0].text}`).join('\n');
            const finalPrompt = `${prompts[mode] || prompts['advice']} \n\n[CONVERSATION HISTORY]: \n${historyText} \n\n${augmentedPrompt} `;

            // If file, we can't easily stream with legacy model via generateContentStream with image in this specific structure
            // But legacy is rare now. We'll just ignore image for legacy fallback or try generateContentStream([finalPrompt, image])
            if (fileObj && fileObj.buffer && fileObj.mimetype) {
                const result = await model.generateContentStream([
                    finalPrompt,
                    { inlineData: { data: fileObj.buffer.toString('base64'), mimeType: fileObj.mimetype } }
                ]);
                return result.stream;
            }

            const result = await model.generateContentStream(finalPrompt);

            if (mode === "draft") {
                return (async function* () {
                    for await (const chunk of result.stream) {
                        const originalText = chunk.text();
                        const cleanedText = originalText.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '');
                        yield {
                            text: () => cleanedText
                        };
                    }
                })();
            }

            return result.stream;
        }
    };

    const fallbackChain = [
        { name: "gemini-2.0-flash", operation: () => performStream("gemini-2.0-flash") },
        { name: "gemini-2.5-flash", operation: () => performStream("gemini-2.5-flash") },
        { name: "gemini-pro-latest", operation: () => performStream("gemini-pro-latest") }
    ];

    try {
        return await executeWithRetry(
            () => performStream(resolvedModel),
            2,
            fallbackChain
        );
    } catch (error) {
        console.error("[Stream Init Error]", error);
        throw new Error(`AI Stream Init Failed: ${error.message}`);
    }
};

// --- SUPPORT EXPORTS ---

export const getEmbedding = async (text) => {
    try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            console.warn("Embedding Quota Exceeded. Disabling RAG.");
            return [];
        }
        console.error("Embedding Error:", error);
        throw error;
    }
};

export const countTokens = async (text, modelName = null) => {
    try {
        const resolvedModel = modelName || await getDefaultModel();
        const model = genAI.getGenerativeModel({ model: resolvedModel });
        const { totalTokens } = await model.countTokens(text);
        return totalTokens || 0;
    } catch (error) {
        console.warn("Token Count API Error:", error.message);
        // Fallback: Local Heuristic (1 token ~= 4 chars)
        const estimated = Math.ceil((text || "").length / 4);
        console.warn(`Using local estimate: ${estimated} tokens`);
        return estimated;
    }
};

export const verifyCitations = async (text) => {
    return await auditLegalResponse(text);
};

export const generateSessionTitle = async (userMessage, aiResponse) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Force a smart but fast model
        const prompt = `Analyze the following initial exchange between a user and a legal AI assistant.
        
        [USER QUESTION]: "${userMessage.substring(0, 1000)}"
        [AI RESPONSE SUMMARY]: "${aiResponse.substring(0, 500)}"
        
        TASK: Generate a short, professional, and specific title for this chat session (Max 3-6 words).
        - Focus on the core legal topic, intent, or specific question asked.
        - Examples: "NDA Drafting for Startups", "Section 302 IPC Analysis", "Property Dispute in Delhi", "Rental Agreement Advice".
        - Avoid generic terms like "Legal Advice" or "Conversation".
        - Do NOT use quotes.
        
        TITLE:`;

        const result = await model.generateContent(prompt);
        let title = result.response.text().trim();
        // Remove quotes and newlines if present
        title = title.replace(/^["']+|["']+$/g, '').replace(/\n/g, ' ');
        // Hard limit length just in case
        if (title.length > 50) title = title.substring(0, 47) + "...";

        return title;
    } catch (e) {
        console.warn("Title auto-generation failed", e);
        // Fallback: Use first few words of user userMessage
        return userMessage.substring(0, 30) + "...";
    }
};

// Controller Compatibility Wrapper
export const generateLegalResponse = async (prompt, modelName, fileObj, language, mode, history) => {
    let finalPrompt = prompt;
    if (language && language.toLowerCase() !== 'english') {
        finalPrompt += `\n[OUTPUT LANGUAGE]: ${language} `;
    }

    // ERA injection is handled inside generateLexAI, but we can structure the text part here basically.
    // generateLexAI will check if input is array and use it.

    // If we have a file, we MUST use array format for GoogleGenerativeAI
    if (fileObj && fileObj.buffer && fileObj.mimetype) {
        const parts = [
            { text: finalPrompt }, // ERA will be handled by logic or we can add here: `[ERA]: ... \n ${finalPrompt}`. 
            // But generateLexAI logic `if (typeof inputContent === 'string')` adds ERA. 
            // If array, it currently DOES NOT add ERA explicitly! 
            // Let's add ERA here to be safe since I see generateLexAI logic for array uses original inputContent.
            {
                inlineData: {
                    data: fileObj.buffer.toString('base64'),
                    mimeType: fileObj.mimetype
                }
            }
        ];

        // We need to fetch ERA again or just hardcode/import logic. analyzeQuery is not exported but available in module scope? 
        // Yes it is in module scope.
        /* 
           Wait, generateLexAI does:
           if (typeof inputContent === 'string') { messageToSend = `[ERA]: ${era}\n${inputContent}`; }
           
           If inputContent is array, messageToSend is just inputContent.
           So ERA is MISSING for file uploads if I don't add it here.
        */
        const analysis = analyzeQuery(finalPrompt);
        parts[0].text = `[METADATA]\n- ERA: ${analysis.era}\n- DETECTED INTENT: ${analysis.intent}\n- USER TYPE: ${analysis.userExpertise}\n- URGENCY: ${analysis.urgency}\n\n[USER REQUEST]:\n${finalPrompt}`;

        return await generateLexAI(parts, history || [], modelName, mode);
    }

    // Default Text Only
    return await generateLexAI(finalPrompt, history || [], modelName, mode);
};
