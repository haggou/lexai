import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create Transporter
// For production, use a service like SendGrid, AWS SES, or a dedicated SMTP/Gmail with App Password
const transporter = nodemailer.createTransport({
    service: 'gmail', // Simply using Gmail for this example. 
    auth: {
        user: process.env.EMAIL_USER, // e.g., your-email@gmail.com
        pass: process.env.EMAIL_PASS  // e.g., your-app-password
    }
});

export const sendOTP = async (email, otp) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn("[EmailService] EMAIL_USER or EMAIL_PASS not set. Falling back to console log.");
            console.log(`[MOCK EMAIL] To: ${email} | OTP: ${otp}`);
            return false;
        }

        const mailOptions = {
            from: `"Legal AI Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Login OTP - Legal AI',
            text: `Your OTP for Legal AI is: ${otp}. It expires in 10 minutes.`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2>Legal AI Login Verification</h2>
                    <p>Your One-Time Password (OTP) is:</p>
                    <h1 style="color: #2c3e50; letter-spacing: 5px;">${otp}</h1>
                    <p>This code is valid for 10 minutes.</p>
                    <hr/>
                    <small>If you did not request this, please ignore this email.</small>
                   </div>`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: %s", info.messageId);
        return true;

    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
