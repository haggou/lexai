import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const key = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

        const response = await fetch(url);
        const data = await response.json();

        fs.writeFileSync('models_list.json', JSON.stringify(data, null, 2));
        console.log("Wrote to models_list.json");

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
