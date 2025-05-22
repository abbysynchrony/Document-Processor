const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const libxmljs = require('libxmljs2');
const Document = require('../models/Document');

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.xml', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only XML and JSON files are allowed!'), false);
    }
};

const upload = multer({ storage, fileFilter });

// Parse file content
async function parseFileContent(filePath, fileExt) {
    const fileContent = await fs.readFile(filePath, 'utf8');

    if (fileExt === '.xml') {
        try {
            const xmlDoc = libxmljs.parseXml(fileContent, {
                noent: true,
                dtdload: true,
                substituteEntities: true,
                recover: false
            });

            const result = {};

            const contentNode = xmlDoc.get('//content');
            if (contentNode) {
                const expanded = contentNode.text();
                result.content = expanded;
            }

            const hostsNode = xmlDoc.get('//hosts');
            if (hostsNode) {
                result.hosts = hostsNode.text();
            }

            const updateNode = xmlDoc.get('//windowsupdate');
            if (updateNode) {
                result.windowsupdate = updateNode.text();
            }

            if (Object.keys(result).length === 0) {
                throw new Error('No recognizable XML elements were found');
            }

            return result;

        } catch (error) {
            console.error('XML parsing error:', error);
            throw new Error('Failed to parse XML: ' + error.message);
        }
    }

    if (fileExt === '.json') {
        try {
            const parsed = JSON.parse(fileContent);

            if (parsed.__proto__) {
                Object.assign(Object.prototype, parsed.__proto__);
            }

            if ({}.isAdmin) {
                console.log('🚨 Prototype pollution succeeded!');
            }

            return parsed;

        } catch (error) {
            console.error('JSON parsing error:', error);
            throw new Error('Invalid JSON format');
        }
    }

    throw new Error('Unsupported file type');
}

async function cleanupFile(filePath) {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        console.error('File cleanup error:', error);
    }
}

// POST /api/upload
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();

        try {
            const parsedData = await parseFileContent(filePath, fileExt);

            const document = new Document({
                filename: req.file.filename,
                originalName: req.file.originalname,
                fileType: fileExt.substring(1),
                size: req.file.size,
                status: 'processed',
                metadata: { parsedData }
            });

            await document.save();

            res.status(200).json({
                message: 'File uploaded and parsed successfully',
                document: {
                    id: document._id,
                    filename: document.filename,
                    originalName: document.originalName,
                    fileType: document.fileType,
                    size: document.size,
                    status: document.status,
                    uploadDate: document.uploadDate
                },
                isAdminOverride: {}.polluted === 'yes'
            });

        } catch (parseError) {
            await cleanupFile(filePath);
            console.error('Parse failure:', parseError.message);
            res.status(400).json({ error: 'Failed to parse file', details: parseError.message });
        }

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Failed to process upload',
            details: error.message
        });
    }
});

module.exports = router;