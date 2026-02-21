import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // For v1beta we can list models?
        // The SDK doesn't expose listModels directly on genAI instance usually, 
        // it's often on the model manager or similar, but the simpler SDK might not have it or it's just `getGenerativeModel`.
        // Wait, the error message literally says: "Call ListModels to see the list of available models"

        // As per newer SDK:
        // const models = await genAI.listModels(); // This might not exist in this version.

        // Attempting to use the `v1beta` URL directly if SDK doesn't help?
        // Let's try to assume the SDK exposes it. checking docs mentally..
        // It's `genAI.getGenerativeModel`... 
        // Actually, let's just try to hit the REST API to see what's valid.

        const key = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("AVAILABLE MODELS:");
            data.models.forEach(m => {
                if (m.name.includes("embedding")) {
                    console.log(`- ${m.name} (Supported: ${m.supportedGenerationMethods})`);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }

    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
