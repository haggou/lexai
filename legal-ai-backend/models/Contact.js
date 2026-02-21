
import { getDB } from '../config/db.js';

class ContactModel {
    static collection() {
        return getDB().collection('contacts');
    }

    static async create(data) {
        return await this.collection().insertOne({
            ...data,
            status: 'pending',
            createdAt: new Date()
        });
    }

    static async findAll(limit = 50) {
        return await this.collection().find({}).sort({ createdAt: -1 }).limit(limit).toArray();
    }
}

export default ContactModel;
