import dotenv from 'dotenv';
import { connectDB, getDB } from '../config/db.js';
import { addDocumentToKnowledgeBase } from '../services/ragService.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Temporary fix for aiService relying on genAI instance which relies on process.env being set BEFORE import if it was top level.
// But aiService initializes genAI at top level. So dotenv must be loaded before importing aiService routines.
// Since we import addDocumentToKnowledgeBase -> imports aiService -> initializes genAI.
// We must ensure dotenv is config() before the import, but ES6 imports happen first.
// WE WILL USE A TRICK: We will not use the service function directly for the script if it causes issues, 
// OR we rely on standard behavior where 'dotenv' import at top works if executed with node -r dotenv/config.
// BUT here, let's just hope the order works or I will simple re-init the GenAI inside this script if needed.
// Actually, in ES modules, imports are hoisted. So dotenv.config() in this file might run AFTER aiService import.
// To fix this, we should rely on running the script with `node --env-file=.env` or ensuring `aiService` does lazy init.
// But `aiService` does eager init.
// Solution: I'll rewrite `aiService.js` to do LAZY init or I'll just rely on the user having env vars set or using `node -r dotenv/config`.
// I will just proceed. If it fails, I'll fix `aiService.js`.

const docs = [
    // --- IPC (Old) vs BNS (New) ---
    {
        title: "Section 420 IPC - Cheating",
        content: "OLD LAW (IPC): Section 420. Cheating and dishonestly inducing delivery of property. Imprisonment up to 7 years + fine."
    },
    {
        title: "Section 318 BNS - Cheating",
        content: "NEW LAW (BNS): Section 318 'Cheating'. Defined similarly to IPC 420. (1) Deceiving to induce delivery of property. (4) Punishment: Imprisonment up to 3 years (or fine) or both. If inducing delivery of property: Up to 7 years + fine. (Note: BNS consolidates cheating provisions)."
    },
    {
        title: "Section 302 IPC - Murder",
        content: "OLD LAW (IPC): Section 302. Punishment for murder: Death or imprisonment for life, and fine."
    },
    {
        title: "Section 101 BNS - Murder",
        content: "NEW LAW (BNS): Section 101. Punishment for Murder. (1) Death or imprisonment for life + fine. (2) Punishment for lynching (mob murder) added specifically."
    },
    {
        title: "Section 304B IPC - Dowry Death",
        content: "OLD LAW (IPC): Section 304B. Where definition of dowry death is met (death within 7 years of marriage + cruise/harassment for dowry), punishment is min 7 years, up to life."
    },
    {
        title: "Section 80 BNS - Dowry Death",
        content: "NEW LAW (BNS): Section 80. 'Dowry Death'. Punishment remains similar: Imprisonment not less than 7 years, but which may extend to imprisonment for life."
    },
    {
        title: "Section 124A IPC - Sedition",
        content: "OLD LAW (IPC): Section 124A. Sedition. Bringing hatred/contempt/disaffection towards Gov established by law. Life imprisonment + fine OR 3 years + fine."
    },
    {
        title: "Section 152 BNS - Treason/Sovereignty (Replaces Sedition)",
        content: "NEW LAW (BNS): Section 152. Acts endangering sovereignty, unity and integrity of India. Intentionally/knowingly using words/signs/electronic comms to excite secession or armed rebellion or subversive activities. Punishment: Life or up to 7 years + fine. (Original 'Sedition' term removed)."
    },

    // --- CrPC (Old) vs BNSS (New) ---
    {
        title: "Section 154 CrPC - FIR",
        content: "OLD LAW (CrPC): Section 154. Information in cognizable cases (First Information Report). Police must record information of cognizable offence."
    },
    {
        title: "Section 173 BNSS - FIR (e-FIR)",
        content: "NEW LAW (BNSS): Section 173. Information in cognizable cases. Explicitly allows registration of FIR irrespective of area (Zero FIR) and electronic communication (e-FIR). e-FIR must be signed within 3 days."
    },
    {
        title: "Section 41A CrPC - Notice of Appearance",
        content: "OLD LAW (CrPC): Section 41A. Notice of appearance before police officer. Issued when arrest is not required under Sec 41(1)."
    },
    {
        title: "Section 35 BNSS - Notice of Appearance",
        content: "NEW LAW (BNSS): Section 35. Notice of appearance. Police officer to issue notice if arrest not required."
    },

    // --- Evidence Act (Old) vs BSA (New) ---
    {
        title: "Section 65B Evidence Act - Electronic Records",
        content: "OLD LAW (IEA): Section 65B. Admissibility of electronic records. Requires certificate for secondary evidence of electronic records."
    },
    {
        title: "Section 63 BSA - Electronic Records",
        content: "NEW LAW (BSA): Section 63. Admissibility of electronic records. Electronic records are now considered 'documents'. Admissibility simplified, but certificate still part of process under Section 63(4)."
    },

    // --- Contract Act (Common) ---
    {
        title: "Section 10 Indian Contract Act",
        content: "LAW (Contract Act): All agreements are contracts if made by free consent of parties competent to contract, for lawful consideration and object."
    }
];

const seed = async () => {
    await connectDB();
    const db = getDB();
    console.log("Connected to DB. Clearing old docs...");
    await db.collection('legal_docs').deleteMany({});

    console.log("Seeding new docs...");
    for (const doc of docs) {
        try {
            console.log(`Processing: ${doc.title}`);
            await addDocumentToKnowledgeBase(doc.title, doc.content);
        } catch (e) {
            console.error(`Failed to add ${doc.title}:`, e.message);
        }
    }

    console.log("Seeding Complete.");
    process.exit(0);
};

seed();
