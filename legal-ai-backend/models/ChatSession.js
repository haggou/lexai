
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

class ChatSessionModel {
    static collection() {
        return getDB().collection('chat_sessions');
    }

    static async create(userId, initialTitle = "New Conversation") {
        const result = await this.collection().insertOne({
            userId: userId,
            title: initialTitle,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result.insertedId;
    }

    static async updateTitle(sessionId, title) {
        return await this.collection().updateOne(
            { _id: new ObjectId(sessionId) },
            { $set: { title: title, updatedAt: new Date() } }
        );
    }

    static async updateTimestamp(sessionId) {
        return await this.collection().updateOne(
            { _id: new ObjectId(sessionId) },
            { $set: { updatedAt: new Date() } }
        );
    }

    static async getSessions(userId, limit = 20, skip = 0) {
        return await this.collection()
            .find({ userId: userId })
            .sort({ updatedAt: -1 }) // Most recent first
            .limit(limit)
            .skip(skip)
            .toArray();
    }

    static async getSession(sessionId) {
        return await this.collection().findOne({ _id: new ObjectId(sessionId) });
    }

    static async deleteSession(sessionId, userId) {
        // Also delete associated messages
        const db = getDB();
        await db.collection('chats').deleteMany({ sessionId: new ObjectId(sessionId) });

        return await this.collection().deleteOne({
            _id: new ObjectId(sessionId),
            userId: userId
        });
    }
}

export default ChatSessionModel;
