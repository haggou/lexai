import { getDB } from '../config/db.js';

class LegalDocModel {
    static collection() {
        return getDB().collection('legal_docs');
    }

    static async create(docData) {
        // docData: { title, content, embedding: [numbers] }
        return await this.collection().insertOne({
            ...docData,
            createdAt: new Date()
        });
    }

    static async getAll() {
        // For local RAG (fetch all and filter in memory)
        // In production with Atlas, use $vectorSearch
        return await this.collection().find({}).toArray();
    }
}

export default LegalDocModel;
