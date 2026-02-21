import { getDB } from '../config/db.js';

class UserModel {
    static collection() {
        return getDB().collection('users');
    }

    static async create(userData) {
        // Ensure indexes (run once or manually, but good to have safety)
        await this.collection().createIndex({ username: 1 }, { unique: true });
        await this.collection().createIndex({ email: 1 }, { unique: true });
        await this.collection().createIndex({ mobile: 1 }, { unique: true, sparse: true });
        await this.collection().createIndex({ referralCode: 1 }, { unique: true, sparse: true });

        const result = await this.collection().insertOne({
            ...userData,
            walletBalance: 50.00, // 50 INR Initial Balance
            subscriptionPlan: 'free', // free, pro, csc
            role: 'user', // user, admin
            referralCode: userData.referralCode, // Ensure this is saved
            referredBy: userData.referredBy || null,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return result;
    }

    static async updateBalance(userId, amount) {
        const { ObjectId } = await import('mongodb');
        const oid = new ObjectId(String(userId));
        console.log(`[User.js] Updating Balance for ID: ${oid}, Amount: ${amount}`);
        const result = await this.collection().updateOne(
            { _id: oid },
            { $inc: { walletBalance: amount } }
        );
        console.log(`[User.js] Update Result: Matched ${result.matchedCount}, Modified ${result.modifiedCount}`);
        return result;
    }

    static async deductBalance(userId, amount) {
        const { ObjectId } = await import('mongodb');
        return await this.collection().updateOne(
            { _id: new ObjectId(userId) },
            { $inc: { walletBalance: -amount } }
        );
    }

    static async findByUsername(username) {
        return await this.collection().findOne({ username: username });
    }

    static async findByReferralCode(code) {
        return await this.collection().findOne({ referralCode: code });
    }

    static async findByEmail(email) {
        return await this.collection().findOne({ email: email });
    }

    static async findByMobile(mobile) {
        return await this.collection().findOne({ mobile: mobile });
    }

    static async findById(id) {
        // Assuming ObjectId is handled by caller or we import it if needed. 
        // For simplicity in raw mongo driver without mongoose, usually ID is ObjectId.
        // modifying to accept string or objectId if passed
        const { ObjectId } = await import('mongodb');
        return await this.collection().findOne({ _id: new ObjectId(id) });
    }

    static async updateOTP(username, otp, expires) {
        return await this.collection().updateOne(
            { username: username }, // Can also accept mobile
            { $set: { otp: otp, otpExpires: expires } }
        );
    }

    static async updatePassword(username, hashedPassword) {
        return await this.collection().updateOne(
            { username: username },
            { $set: { password: hashedPassword, otp: null, otpExpires: null } }
        );
    }
    static async updateProfile(userId, updateData) {
        const { ObjectId } = await import('mongodb');
        return await this.collection().updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    ...updateData,
                    updatedAt: new Date()
                }
            }
        );
    }

    static async deleteUser(userId) {
        const { ObjectId } = await import('mongodb');
        return await this.collection().deleteOne({ _id: new ObjectId(userId) });
    }

    static async countReferrals(userId) {
        const { ObjectId } = await import('mongodb');
        const id = new ObjectId(userId);
        // Logic: Count where referredBy is THIS user's ID
        // Note: referredBy in create() is stored as whatever referrer._id was.
        // Assuming it's consistently ObjectId.
        return await this.collection().countDocuments({ referredBy: id });
    }

    static async findAll(query = {}, limit = 50, skip = 0) {
        return await this.collection().find(query).limit(limit).skip(skip).toArray();
    }
}

export default UserModel;
