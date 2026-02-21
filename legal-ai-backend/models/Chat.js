import { getDB } from '../config/db.js';

class ChatModel {
    static collection() {
        return getDB().collection('chats');
    }

    static async create(chatData) {
        const data = {
            ...chatData,
            timestamp: new Date()
        };
        // Ensure sessionId is stored as ObjectId if present
        if (data.sessionId && typeof data.sessionId === 'string') {
            const { ObjectId } = await import('mongodb');
            data.sessionId = new ObjectId(data.sessionId);
        }

        const result = await this.collection().insertOne(data);
        return result;
    }

    static async getHistory(userId, limit = 50, skip = 0) {
        // Legacy support: returns all messages for user if no session
        return await this.collection()
            .find({ userId: userId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(skip)
            .toArray();
    }

    static async getSessionMessages(sessionId) {
        const { ObjectId } = await import('mongodb');
        return await this.collection()
            .find({ sessionId: new ObjectId(sessionId) })
            .sort({ timestamp: 1 }) // Chronological order for chat view
            .toArray();
    }

    static async deleteMessage(messageId, userId) {
        const { ObjectId } = await import('mongodb');
        return await this.collection().deleteOne({
            _id: new ObjectId(messageId),
            userId: userId
        });
    }

    static async clearHistory(userId) {
        return await this.collection().deleteMany({ userId: userId });
    }

    static async findAll() {
        return await this.collection().find().toArray();
    }
}

export default ChatModel;
