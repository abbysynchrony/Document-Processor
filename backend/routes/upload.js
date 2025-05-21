const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
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

// File filter to only accept XML and JSON files
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.xml', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only XML and JSON files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Helper function to parse file content
async function parseFileContent(filePath, fileExt) {
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    if (fileExt === '.xml') {
        return await parser.parseStringPromise(fileContent);
    } else if (fileExt === '.json') {
        try {
            return JSON.parse(fileContent);
        } catch (error) {
            throw new Error('Invalid JSON format');
        }
    }
    throw new Error('Unsupported file type');
}

// Helper function to clean up file
async function cleanupFile(filePath) {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        console.error('Error cleaning up file:', error);
    }
}

// POST /api/upload - Handle file uploads
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        
        try {
            const parsedData = await parseFileContent(filePath, fileExt);

            // Create document metadata in MongoDB
            const document = new Document({
                filename: req.file.filename,
                originalName: req.file.originalname,
                fileType: fileExt.substring(1), // Remove the dot from extension
                size: req.file.size,
                status: 'processed',
                metadata: {
                    parsedData: parsedData
                }
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
                }
            });
        } catch (parseError) {
            await cleanupFile(filePath);
            throw parseError;
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(error.message.includes('Invalid') ? 400 : 500).json({ 
            error: 'Failed to process upload',
            details: error.message 
        });
    }
});

module.exports = router; 