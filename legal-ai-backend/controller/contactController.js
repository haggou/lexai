
import ContactModel from '../models/Contact.js';
import { validationResult } from 'express-validator';

export const submitContactForm = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, subject, message } = req.body;

        const result = await ContactModel.create({
            name,
            email,
            subject,
            message
        });

        res.status(201).json({
            message: "Inquiry submitted successfully",
            id: result.insertedId
        });
    } catch (error) {
        console.error("Contact Form Error:", error);
        res.status(500).json({ error: "Server error, please try again later." });
    }
};
