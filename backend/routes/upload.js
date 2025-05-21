const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const libxmljs = require('libxmljs2');
const xml2js = require('xml2js');
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
        // Removed file size limit to allow large XML files
    }
});

// Helper function to parse file content
async function parseFileContent(filePath, fileExt) {
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    if (fileExt === '.xml') {
        try {
            // First parse with libxmljs2 for XXE
            const xmlDoc = libxmljs.parseXml(fileContent, {
                noblanks: false,
                noent: true,  // Enable entity expansion
                nocdata: false,
                nowarning: true,
                pedantic: false,
                recover: true,
                maxDepth: -1,  // Disable depth limit
                maxChars: -1,  // Disable character limit
                dtdload: true, // Enable DTD loading
                dtdvalid: true, // Enable DTD validation
                baseUrl: null, // Disable base URL resolution
                substituteEntities: true // Enable entity substitution
            });

            // Get the data element if it exists
            const dataElement = xmlDoc.get('//data');
            let result = {};
            
            if (dataElement) {
                // Get the raw text content without any processing
                result.content = dataElement.toString();
            }

            // Get hosts element if it exists
            const hostsElement = xmlDoc.get('//hosts');
            if (hostsElement) {
                result.hosts = hostsElement.text();
            }

            // Get system element if it exists
            const systemElement = xmlDoc.get('//system');
            if (systemElement) {
                result.system = systemElement.text();
            }

            // Now parse with xml2js for DoS
            const parser = new xml2js.Parser({
                explicitArray: false,
                mergeAttrs: true,
                explicitRoot: true,
                tagNameProcessors: [xml2js.processors.stripPrefix],
                valueProcessors: [xml2js.processors.parseBooleans, xml2js.processors.parseNumbers],
                attrValueProcessors: [xml2js.processors.parseBooleans, xml2js.processors.parseNumbers],
                // Disable all protections
                ignoreAttrs: false,
                explicitChildren: false,
                childkey: '$$',
                charsAsChildren: false,
                includeWhiteChars: true,
                async: false,
                strict: false,
                trim: false,
                normalize: false,
                normalizeTags: false,
                explicitArray: false,
                tagNameProcessors: [],
                valueProcessors: [],
                attrValueProcessors: [],
                // Enable entity expansion
                entityExpansion: true,
                // Disable limits
                maxDepth: -1,
                maxLength: -1
            });

            // This will attempt to parse the same file again, potentially causing DoS
            await parser.parseStringPromise(fileContent);

            // If we found any elements from libxmljs2, return them
            if (Object.keys(result).length > 0) {
                return result;
            }
            
            // If no specific elements found, return the whole document
            return { content: xmlDoc.toString() };
        } catch (error) {
            console.error('XML parsing error:', error);
            throw new Error('Failed to parse XML: ' + error.message);
        }
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