import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

export const sendSMS = async (mobile, otp) => {
    try {
        const apiKey = process.env.FAST2SMS_API_KEY;

        if (!apiKey) {
            console.warn("[SMS Service] FAST2SMS_API_KEY not set. Falling back to console log.");
            console.log(`[MOCK SMS] To: ${mobile} | Message: Your OTP is ${otp}`);
            return false;
        }

        // Fast2SMS API Options
        const options = {
            "method": "POST",
            "hostname": "www.fast2sms.com",
            "port": null,
            "path": "/dev/bulkV2",
            "headers": {
                "authorization": apiKey,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                const chunks = [];

                res.on("data", (chunk) => {
                    chunks.push(chunk);
                });

                res.on("end", () => {
                    const body = Buffer.concat(chunks).toString();
                    console.log("[SMS Service] Response:", body);
                    resolve(true);
                });
            });

            req.on("error", (e) => {
                console.error("[SMS Service] Request Error:", e);
                resolve(false);
            });

            // "variables_values" is where we put the OTP. 
            // Route "otp" or "dlt" depending on plan. "v3" or "bulkV2" commonly use sending just text or template.
            // Using the 'Quick Send' route via bulkV2 for simplicity:
            const postData = `message=Your Legal AI OTP is ${otp}&language=english&route=q&numbers=${mobile}`;

            req.write(postData);
            req.end();
        });

    } catch (error) {
        console.error("SMS Sending Error:", error);
        return false;
    }
};
