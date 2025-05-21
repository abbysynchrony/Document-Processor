const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a PDF from the provided HTML content
 * @param {Object} data - The data to be rendered in the template
 * @param {Function} renderTemplate - Function to render the template
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generatePDF(data, renderTemplate) {
    return new Promise((resolve, reject) => {
        try {
            // Create a new PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            // Collect PDF chunks
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));

            // Add title
            doc.fontSize(24)
               .text(data.title, { align: 'center' });

            // Add subtitle if exists
            if (data.subtitle) {
                doc.fontSize(16)
                   .text(data.subtitle, { align: 'center' })
                   .moveDown();
            }

            // Add metadata section if exists
            if (data.metadata) {
                doc.fontSize(12)
                   .text('Document Information', { underline: true })
                   .moveDown(0.5);

                Object.entries(data.metadata).forEach(([key, value]) => {
                    doc.fontSize(10)
                       .text(`${key}: ${value}`);
                });
                doc.moveDown();
            }

            // Add main content
            if (data.content) {
                doc.fontSize(12);
                // Remove HTML tags and decode HTML entities
                const cleanContent = data.content
                    .replace(/<[^>]*>/g, '')  // Remove HTML tags
                    .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with space
                    .replace(/&lt;/g, '<')    // Replace &lt; with <
                    .replace(/&gt;/g, '>')    // Replace &gt; with >
                    .replace(/&amp;/g, '&');  // Replace &amp; with &
                
                // Split content into lines and add to PDF
                const lines = cleanContent.split('\n');
                lines.forEach(line => {
                    if (line.trim()) {
                        doc.text(line.trim());
                    }
                });
            }

            // Add footer
            doc.fontSize(10)
               .text(`Generated on: ${data.generatedAt}`, { align: 'center' });
            
            if (data.documentId) {
                doc.text(`Document ID: ${data.documentId}`, { align: 'center' });
            }

            // Finalize the PDF
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { generatePDF }; 