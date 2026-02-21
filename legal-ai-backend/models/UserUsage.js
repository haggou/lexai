import { getDB } from '../config/db.js';

class UserUsageModel {
    static collection() {
        return getDB().collection('user_usage');
    }

    static async updateUsage(userId, inputTokens, outputTokens) {
        if (!userId) return;

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const result = await this.collection().updateOne(
            { userId: userId },
            {
                $inc: {
                    totalInputTokens: inputTokens,
                    totalOutputTokens: outputTokens,
                    totalRequestCount: 1,
                    [`dailyUsage.${today}.input`]: inputTokens,
                    [`dailyUsage.${today}.output`]: outputTokens,
                    [`dailyUsage.${today}.requests`]: 1
                },
                $set: { lastActive: new Date() }
            },
            { upsert: true }
        );
        return result;
    }

    static async getUsage(userId) {
        return await this.collection().findOne({ userId: userId });
    }
}

export default UserUsageModel;
