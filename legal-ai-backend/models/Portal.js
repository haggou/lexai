import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

class PortalModel {
    static collection() {
        return getDB().collection('portals');
    }

    static async create(portalData) {
        // portalData: { userId, title, path, description, category }
        const result = await this.collection().insertOne({
            ...portalData,
            userId: new ObjectId(portalData.userId),
            createdAt: new Date()
        });
        // result.insertedId is the new _id
        return { ...portalData, _id: result.insertedId, userId: new ObjectId(portalData.userId), createdAt: new Date() };
    }

    static async findByUserId(userId) {
        return await this.collection()
            .find({ userId: new ObjectId(userId) })
            .toArray();
    }

    static async delete(portalId, userId) {
        return await this.collection().deleteOne({
            _id: new ObjectId(portalId),
            userId: new ObjectId(userId)
        });
    }
}

export default PortalModel;