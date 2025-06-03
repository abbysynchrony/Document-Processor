const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const { generatePDF } = require('./utils/pdfGenerator');
const Document = require('./models/Document');
const vulnMap = require('./utils/vulnMap');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// 🔓 Set up Handlebars with prototype access enabled
const insecureHandlebars = allowInsecurePrototypeAccess(handlebars);

const hbs = exphbs.create({
    handlebars: insecureHandlebars,
    extname: '.hbs',
    defaultLayout: false,
    helpers: {
        formatDate: function(date) {
            return new Date(date).toLocaleString();
        }
    }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'templates'));

// MongoDB Connection with retry logic
const connectWithRetry = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB Atlas');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
    }
};

connectWithRetry();

// Import routes
const uploadRoutes = require('./routes/upload');
const exportRoutes = require('./routes/export');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!require('fs').existsSync(uploadsDir)) {
    require('fs').mkdirSync(uploadsDir);
}

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Helper function to prepare document data
async function prepareDocumentData(documentId) {
    if (!documentId) {
        return {
            title: 'Sample Document',
            subtitle: 'This is a test document',
            metadata: {
                author: 'John Doe',
                date: new Date().toISOString(),
                version: '1.0'
            },
            content: 'This is a sample document content. It demonstrates how the PDF generation works with various types of data.\n\nYou can include multiple paragraphs and formatted text here.',
            generatedAt: new Date().toLocaleString(),
            documentId: 'DOC-' + Math.random().toString(36).substr(2, 9)
        };
    }

    const document = await Document.findById(documentId);
    if (!document) {
        throw new Error('Document not found');
    }

    return {
        title: document.originalName,
        subtitle: `Uploaded on ${new Date(document.uploadDate).toLocaleString()}`,
        metadata: {
            'File Type': document.fileType,
            'File Size': `${(document.size / 1024).toFixed(2)} KB`,
            'Status': document.status
        },
        content: formatXmlContent(document.metadata.parsedData),
        generatedAt: new Date().toLocaleString(),
        documentId: document._id.toString()
    };
}

// Document preview route
app.get('/document', async (req, res) => {
    try {
        const data = await prepareDocumentData(req.query.id);
        const isAdminOverride = {}.polluted === 'yes' || {}.isAdmin === true;
        const isArrayPolluted = [].isArrayPolluted === true;

        // Don't clear either property - let them persist
        // This matches the behavior of the upload route

        // Get vulnerability info from document
        const document = await Document.findById(req.query.id);
        const vulnInfo = document && document.vulnType ? vulnMap[document.vulnType] : null;

        // Expose internal data for template injection
        const internalData = {
            env: Object.entries(process.env).reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {}),
            serverInfo: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                cwd: process.cwd(),
                memoryUsage: process.memoryUsage()
            },
            config: {
                mongodb: process.env.MONGODB_URI ? '***' : null,
                port: process.env.PORT,
                nodeEnv: process.env.NODE_ENV
            }
        };

        const template = {}.templateName || 'document';

        res.render(template, {
            ...data,
            ...internalData,
            showDownloadButton: true,
            isAdminOverride,
            isArrayPolluted,
            vulnInfo,
            // Expose prototype pollution test
            prototypeTest: Object.prototype.toString.call({}),
            // Expose constructor for SSTI
            constructor: Object.getPrototypeOf({}).constructor,
            // Expose process for SSTI
            process: process
        });
    } catch (error) {
        console.error('Error rendering document:', error);
        res.status(500).send('Rendering failed: ' + error.message);
    }
});

// PDF download route
app.get('/document/pdf', async (req, res) => {
    try {
        const data = await prepareDocumentData(req.query.id);
        const pdfBuffer = await generatePDF(data);

        const originalFilename = data.title;
        const pdfFilename = originalFilename.replace(/\.[^/.]+$/, '.pdf');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${pdfFilename}"`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(error.message === 'Document not found' ? 404 : 500)
           .json({ error: error.message || 'Failed to generate PDF' });
    }
});

app.get('/pollution-check', (req, res) => {
    // Check first — capture status before clearing
    const isPolluted = [].isArrayPolluted === true;
    
    // Clear it immediately after
    if (Array.prototype.hasOwnProperty('isArrayPolluted')) {
        delete Array.prototype.isArrayPolluted;
    }
    
    res.render('pollution-check', { isPolluted });
});

// Helper to format content from XML/JSON
function formatXmlContent(data) {
    if (!data) return '';

    // 🔥 Vulnerable to prototype pollution - using direct property access
    const library = data.library || (data.parsedData && data.parsedData.library);
    if (library) {
        // 🔥 Vulnerable to prototype pollution - using Array.isArray
        const books = Array.isArray(library) ? library :
                     Array.isArray(library.book) ? library.book :
                     [library.book];
        
        return books.map(book => `
            <div class="book-entry">
                <h3>${book.title}</h3>
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>Genre:</strong> ${book.genre}</p>
                <p><strong>Published:</strong> ${book.published}</p>
                ${book.id ? `<p><strong>ID:</strong> ${book.id}</p>` : ''}
            </div>
        `).join('');
    }

    // 🔥 Vulnerable to prototype pollution - using direct property access
    if (data.user) {
        return `
            <div class="user-profile">
                <h3>User Profile</h3>
                <p><strong>ID:</strong> ${data.user.id[0]}</p>
                <p><strong>Name:</strong> ${data.user.name[0]}</p>
                <p><strong>Email:</strong> ${data.user.email[0]}</p>
            </div>
        `;
    }

    // 🔥 Vulnerable to prototype pollution - using JSON.stringify
    return `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});