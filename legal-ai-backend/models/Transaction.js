
import { getDB } from '../config/db.js';

class TransactionModel {
    static collection() {
        return getDB().collection('transactions');
    }

    /**
     * Create a new transaction record
     * @param {Object} data - { userId, amount, type, description, metadata }
     */
    static async create(data) {
        return await this.collection().insertOne({
            userId: data.userId.toString(), // Enforce String
            amount: parseFloat(data.amount),
            type: data.type, // 'CREDIT' | 'DEBIT'
            category: data.category, // 'RECHARGE', 'SUBSCRIPTION', 'USAGE'
            description: data.description,
            metadata: data.metadata || {},
            timestamp: new Date()
        });
    }

    static async getHistory(userId, limit = 20) {
        const query = { userId: userId.toString() };
        let cursor = this.collection().find(query).sort({ timestamp: -1 });

        if (limit > 0) cursor = cursor.limit(limit);

        return await cursor.toArray();
    }

    static async getStats(userId) {
        const stats = await this.collection().aggregate([
            { $match: { userId: userId.toString() } },
            {
                $group: {
                    _id: "$type",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        return {
            totalCredit: stats.find(s => s._id === 'CREDIT')?.total || 0,
            totalDebit: stats.find(s => s._id === 'DEBIT')?.total || 0,
            count: stats.reduce((acc, curr) => acc + curr.count, 0)
        };
    }


    static find(query) {
        return this.collection().find(query);
    }

    static async getRecentGlobalActivity(limit = 10) {
        const txs = await this.collection().aggregate([
            { $sort: { timestamp: -1 } },
            { $limit: limit },
            {
                $addFields: {
                    userObjectId: { $toObjectId: "$userId" }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userObjectId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    timestamp: 1,
                    username: '$user.username',
                    type: 1,
                    amount: 1,
                    description: 1
                }
            }
        ]).toArray();
        return txs;
    }

    static async getTotalRevenue() {
        // Calculate revenue based on Credits (Money In)
        // You might want to filter by category like 'SUBSCRIPTION' or 'RECHARGE' if internal credits exist
        const result = await this.collection().aggregate([
            { $match: { type: 'CREDIT' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray();
        return result[0]?.total || 0;
    }

    static async getMonthlyRevenueData() {
        const result = await this.collection().aggregate([
            { $match: { type: 'CREDIT' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$timestamp" } },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();

        return result.map(r => ({ name: r._id, revenue: r.total }));
    }
}

export default TransactionModel;
