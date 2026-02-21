
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { generateLegalResponse } from '../services/aiService.js';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testUpload() {
    console.log("Starting Manual File Upload Test...");
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("API Key loaded:", apiKey ? `Yes (${apiKey.substring(0, 4)}...)` : "No");

    // 1. Mock a simple Text file
    const dummyBuffer = Buffer.from("This is a simple text file for testing purposes.");

    const mockFile = {
        buffer: dummyBuffer,
        mimetype: 'text/plain',
        originalname: 'test.txt'
    };

    const prompt = "What is this file about?";
    const model = "gemini-1.5-flash"; // Use flash for speed
    const language = "English";
    const mode = "advice";

    try {
        console.log("Calling generateLegalResponse...");
        const response = await generateLegalResponse(
            prompt,
            model,
            mockFile,
            language,
            mode,
            [] // history
        );

        console.log("\n--- SUCCESS ---");
        console.log("AI Response:", response);

    } catch (error) {
        console.error("\n--- FAILED ---");
        console.error(error);
        fs.writeFileSync('error_log_manual.txt', `Error: ${error.message}\nStack: ${error.stack}\nDetails: ${JSON.stringify(error, null, 2)}`, 'utf8');
    }
}

testUpload();
