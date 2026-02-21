import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generatePDF = async (text, title = "Legal Document") => {
    return new Promise((resolve, reject) => {
        try {
            // A4 Size with clean margins
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                },
                info: {
                    Title: title,
                    Author: 'LexAI',
                    Creator: 'LexAI Legal Assistant'
                }
            });

            const buffers = [];

            // Register Hindi Font (Essential for Human Readability)
            // Fallback to standard font if Hindi font is missing
            const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'NotoSansDevanagari-Regular.ttf');
            let fontLoaded = false;

            if (fs.existsSync(fontPath)) {
                try {
                    doc.font(fontPath);
                    fontLoaded = true;
                } catch (e) {
                    console.warn("Failed to load Hindi font:", e.message);
                }
            } else {
                console.warn("Hindi Font file not found at:", fontPath);
            }

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Clean Title Styling
            if (fontLoaded) {
                doc.font(fontPath).fontSize(16).text(title, { align: 'center' });
            } else {
                doc.font('Helvetica-Bold').fontSize(16).text(title, { align: 'center' });
            }

            doc.moveDown(1.5);

            // Content Styling
            const contentOptions = {
                align: 'justify',
                paragraphGap: 10,
                lineGap: 4,
                width: 495 // A4 width (595) - margins (100)
            };

            if (fontLoaded) {
                // Remove Markdown artifact stars for bold/italic as they look bad in PDF
                const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');
                doc.font(fontPath).fontSize(11).text(cleanText, contentOptions);
            } else {
                // Fallback for English only if font missing
                const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');
                doc.font('Helvetica').fontSize(11).text(cleanText, contentOptions);
            }

            doc.end();
        } catch (error) {
            console.error("PDF Generation Error:", error);
            reject(error);
        }
    });
};
