import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { generateLexAI } from './aiService.js';

dotenv.config();

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SarvamService {
    constructor() {
        this.apiKey = process.env.SARVAM_API_KEY;
        this.client = null;
        this.initClient();
    }

    async initClient() {
        if (this.client) return;

        try {
            // Dynamic import to prevent crash if package is missing
            const module = await import('sarvamai');
            if (module && module.SarvamAIClient) {
                this.client = new module.SarvamAIClient({
                    apiSubscriptionKey: this.apiKey
                });
                console.log('✅ Sarvam AI Client Initialized');
            } else {
                console.warn('⚠️ SarvamAIClient not found in module "sarvamai".');
            }
        } catch (error) {
            console.error('❌ Failed to load "sarvamai" package. Please run: npm install sarvamai');
            // Fallback: We might implement direct fetch here if needed, but for now we rely on the SDK
        }
    }

    /**
     * Extracts text/markdown from a document (PDF/Image) using Sarvam AI
     * @param {string} filePath - Absolute path to the file
     * @returns {Promise<string>} - Extracted markdown text
     */
    async extractText(filePath) {
        if (!this.client) await this.initClient();
        if (!this.client) throw new Error("Sarvam AI Client not initialized. Is 'sarvamai' installed?");

        try {
            console.log(`[Sarvam] Starting analysis for: ${filePath}`);

            // 1. Create Job
            const job = await this.client.documentIntelligence.createJob({
                language: "hi-IN", // Default to Hindi/English common in Indian context
                outputFormat: "md"
            });
            console.log(`[Sarvam] Job Created: ${job.jobId}`);

            // 2. Upload File
            // The SDK likely takes a path string.
            await job.uploadFile(filePath);
            console.log(`[Sarvam] File Uploaded`);

            // 3. Start Processing
            await job.start();
            console.log(`[Sarvam] Job Started`);

            // 4. Wait for Completion
            const status = await job.waitUntilComplete({ timeout: 300000 }); // 5 min timeout
            console.log(`[Sarvam] Job Output Status: ${status.job_state}`);

            if (status.job_state !== 'completed') {
                throw new Error(`Sarvam Job failed with state: ${status.job_state}`);
            }

            // 5. Download Output (ZIP)
            const outputDir = path.join(path.dirname(filePath), 'sarvam_output_' + job.jobId);
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

            const zipPath = path.join(outputDir, 'output.zip');
            await job.downloadOutput(zipPath);
            console.log(`[Sarvam] Output downloaded to: ${zipPath}`);

            // 6. Unzip and Read Content
            // We use PowerShell to unzip on Windows, or unzip command on Linux depending on OS.
            // Since user is on Windows (based on paths), we use PowerShell 
            // OR use a simple unzip library if we had one.
            // We'll try a cross-platform approach: unzipping.

            await this.unzipFile(zipPath, outputDir);

            // 7. Find .md file
            const files = fs.readdirSync(outputDir);
            const mdFile = files.find(f => f.endsWith('.md'));

            if (!mdFile) {
                throw new Error("No Markdown file found in Sarvam output.");
            }

            const content = fs.readFileSync(path.join(outputDir, mdFile), 'utf8');

            // Cleanup
            // fs.rmSync(outputDir, { recursive: true, force: true }); 
            // Keep it for debug for now or implement cleanup policy

            return content;
        } catch (error) {
            console.error("[Sarvam Error]", error);
            throw error;
        }
    }

    /**
     * Unzips a file using OS native tools
     */
    async unzipFile(zipPath, destDir) {
        const isWindows = process.platform === 'win32';
        try {
            if (isWindows) {
                // Use PowerShell to expand archive
                const command = `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`;
                await execPromise(command);
            } else {
                // Use unzip command on Linux/Mac
                await execPromise(`unzip -o "${zipPath}" -d "${destDir}"`);
            }
        } catch (error) {
            console.error("Unzip failed:", error);
            throw new Error("Failed to unzip Sarvam output. Ensure PowerShell (Windows) or unzip (Linux) is available.");
        }
    }

    /**
     * Analyzes and Advises on a document
     * @param {string} filePath - Path to file
     * @param {string} userQuery - Specific question (optional)
     */
    async adviseOnDocument(filePath, userQuery = "Analyze this legal document and provide key insights, risks, and summary.") {
        // 1. Extract Text
        let extractedText = "";
        try {
            extractedText = await this.extractText(filePath);
        } catch (err) {
            console.error("Extraction failed, trying fallback or returning error", err);
            throw err;
        }

        // 2. Advise using LLM (Gemini via aiService)
        // We construct a prompt with the extracted text.
        const prompt = `
[CONTEXT: LEGAL DOCUMENT ANALYSIS]
The user has provided a document. The content has been extracted below using OCR/Document Intelligence.
Please answer the user's query based on this document.

[USER QUERY]: ${userQuery}

[DOCUMENT CONTENT (EXTRACTED)]:
${extractedText.substring(0, 50000)} 
        `; // Limit context if needed, but Gemini 1.5 has large window.

        // Use 'advice' mode by default
        const advice = await generateLexAI(prompt, [], null, 'advice');

        return {
            documentText: extractedText,
            advice: advice
        };
    }
}

export const sarvamService = new SarvamService();
