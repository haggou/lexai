import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // Actually the SDK doesn't have a direct 'listModels' helper easily accessible on the instance 
        // without using the specialized ModelService if I recall correctly, 
        // but we can try to just generate content with 'gemini-1.5-flash-latest' to see if that works,
        // or 'gemini-pro'.

        // However, let's try to fetch the models via REST if the SDK doesn't expose it easily in this version.
        // The error message suggests `ListModels` is an available call on the API. 

        // Let's try standard models.
        console.log("Testing gemini-1.5-flash...");
        try {
            const model1 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            await model1.generateContent("Test");
            console.log("gemini-1.5-flash: OK");
        } catch (e) {
            console.log("gemini-1.5-flash: FAILED", e.message);
        }

        console.log("Testing gemini-1.5-flash-001...");
        try {
            const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
            await model2.generateContent("Test");
            console.log("gemini-1.5-flash-001: OK");
        } catch (e) {
            console.log("gemini-1.5-flash-001: FAILED", e.message);
        }

        console.log("Testing gemini-pro...");
        try {
            const model3 = genAI.getGenerativeModel({ model: "gemini-pro" });
            await model3.generateContent("Test");
            console.log("gemini-pro: OK");
        } catch (e) {
            console.log("gemini-pro: FAILED", e.message);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
