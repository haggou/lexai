import { getEmbedding } from './aiService.js';
import LegalDocModel from '../models/LegalDoc.js';
import { getDB } from '../config/db.js';

// Utility: Cosine Similarity (Fallback for Local Memory)
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const buildRAGContext = async (query, threshold = 0.5, maxResults = 3) => {
    try {
        // 1. Get Query Embedding
        const queryEmbedding = await getEmbedding(query);
        if (!queryEmbedding || queryEmbedding.length === 0) return ""; // Skip RAG if no embedding (Quota Limit)

        let topDocs = [];

        // 2. Try MongoDB Atlas Vector Search (Aggregated Pipeline)
        // Only works if the "vector_index" is created on Atlas.
        // We wrap in try-catch to fallback to in-memory if it fails or isn't set up.
        try {
            const db = getDB();
            const collection = db.collection('legal_docs');

            // Atlas Vector Search Pipeline
            const pipeline = [
                {
                    "$vectorSearch": {
                        "index": "vector_index",
                        "path": "embedding",
                        "queryVector": queryEmbedding,
                        "numCandidates": 50,
                        "limit": maxResults
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "title": 1,
                        "content": 1,
                        "score": { "$meta": "vectorSearchScore" }
                    }
                }
            ];

            const cursor = collection.aggregate(pipeline);
            const results = await cursor.toArray();

            if (results.length > 0) {
                topDocs = results;
                console.log("[RAG] Used Atlas Vector Search");
            }
        } catch (atlasKeyError) {
            // Atlas Search not configured or local DB
            // console.log("[RAG] Atlas Vector Search failed/skipped, falling back to In-Memory.");
        }

        // 3. Fallback: Local In-Memory Search (If Atlas returned nothing)
        if (topDocs.length === 0) {
            const allDocs = await LegalDocModel.getAll();
            if (allDocs && allDocs.length > 0) {
                const scoredDocs = allDocs.map(doc => ({
                    ...doc,
                    score: cosineSimilarity(queryEmbedding, doc.embedding)
                }));
                topDocs = scoredDocs
                    .filter(doc => doc.score >= threshold)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, maxResults);
                console.log("[RAG] Used In-Memory Search");
            }
        }

        // 4. Format Context
        if (topDocs.length === 0) return "";

        const contextText = topDocs.map((doc, index) =>
            `MATCH ${index + 1} (Score: ${doc.score ? doc.score.toFixed(2) : 'N/A'}):\nSOURCE: ${doc.title}\nCONTENT: ${doc.content}`
        ).join("\n\n");

        return `\n\nRELEVANT LEGAL CONTEXT (from Knowledge Base):\n${contextText}\n\n`;

    } catch (error) {
        console.error("RAG Error:", error);
        return ""; // Fail gracefully
    }
};

export const addDocumentToKnowledgeBase = async (title, content) => {
    const embedding = await getEmbedding(content);
    await LegalDocModel.create({ title, content, embedding });
    return true;
};
