
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-1.5-pro', 'gemini-1.5-pro-001', 'gemini-1.0-pro', 'gemini-pro'];

    for (const modelName of models) {
        console.log(`Testing ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`[SUCCESS] ${modelName}:`, result.response.text());
            return; // Found one!
        } catch (e) {
            console.error(`[FAILED] ${modelName}: ${e.message.split(']')[0]}]`); // Print brief error
        }
    }
}
run();
