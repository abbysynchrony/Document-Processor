const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const libxmljs = require('libxmljs2');
const Document = require('../models/Document');
const handlebars = require('handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const insecureHandlebars = allowInsecurePrototypeAccess(handlebars);

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
    // Clean up any existing prototype pollution
    if (Object.prototype.hasOwnProperty('polluted')) {
        delete Object.prototype.polluted;
    }
    // Don't clean up isAdmin - let it persist like isArrayPolluted
    if (Object.prototype.hasOwnProperty('exposedSecrets')) {
        delete Object.prototype.exposedSecrets;
    }
    // Don't clean up isArrayPolluted here - let it persist like isAdmin

    const fileContent = await fs.readFile(filePath, 'utf8');

    // Check for XML Bomb first
    if (fileExt === '.xml') {
        // Check for entity expansion pattern
        if (fileContent.includes('<!ENTITY') && 
            fileContent.includes('&') && 
            fileContent.includes('>')) {
            // Count the number of entity definitions to detect potential bomb
            const entityCount = (fileContent.match(/<!ENTITY/g) || []).length;
            if (entityCount > 10) { // If there are many entity definitions, likely a bomb
                throw new Error('XML_BOMB_DETECTED');
            }
        }
    }

    if (fileExt === '.xml') {
        try {
            const xmlDoc = libxmljs.parseXml(fileContent, {
                noent: true,
                dtdload: true,
                substituteEntities: true,
                recover: false
            });

            const result = {};

            // Extract all nodes for better XXE exploitation
            const allNodes = xmlDoc.find('//*');
            allNodes.forEach(node => {
                const nodeName = node.name();
                const nodeValue = node.text();
                result[nodeName] = nodeValue;
            });

            // Special handling for entity expansion
            const contentNode = xmlDoc.get('//content');
            if (contentNode) {
                const expanded = contentNode.text();
                result.content = expanded;
                
                // If content contains XML-like data, try to parse it
                if (expanded.includes('<') && expanded.includes('>')) {
                    try {
                        const innerXml = libxmljs.parseXml(expanded, {
                            noent: true,
                            dtdload: true,
                            substituteEntities: true,
                            maxEntityExpansion: 0,
                            maxEntityDepth: 0,
                            maxEntitySize: 0
                        });
                        const innerNodes = innerXml.find('//*');
                        innerNodes.forEach(node => {
                            result[`inner_${node.name()}`] = node.text();
                        });
                    } catch (e) {
                        // Ignore parsing errors for inner XML
                    }
                }
            }

            // Extract any system entities
            const systemEntities = xmlDoc.find('//*[contains(text(), "file://")]');
            systemEntities.forEach(entity => {
                result[`system_entity_${entity.name()}`] = entity.text();
            });

            // Try to read mock files if entities point to them
            const mockFiles = ['internal-config.xml', 'secrets.json', 'env.prod'];
            mockFiles.forEach(mockFile => {
                if (result.content && result.content.includes(mockFile)) {
                    try {
                        const mockContent = require('fs').readFileSync(
                            path.join(__dirname, '../uploads', mockFile),
                            'utf8'
                        );
                        result[`mock_${mockFile}`] = mockContent;
                    } catch (e) {
                        console.error(`Failed to read mock file ${mockFile}:`, e);
                    }
                }
            });

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
    
            // 🔥 Vulnerable to prototype pollution
            if (parsed.__proto__) {
                // Allow full prototype pollution
                Object.assign(Object.prototype, parsed.__proto__);
                
                // Expose sensitive data through pollution
                if (parsed.__proto__.exposeSecrets) {
                    Object.defineProperty(Object.prototype, 'exposedSecrets', {
                        get: function() {
                            return {
                                env: process.env,
                                config: {
                                    mongodb: process.env.MONGODB_URI,
                                    port: process.env.PORT,
                                    nodeEnv: process.env.NODE_ENV
                                },
                                serverInfo: {
                                    nodeVersion: process.version,
                                    platform: process.platform,
                                    cwd: process.cwd()
                                }
                            };
                        },
                        enumerable: true,
                        configurable: true
                    });
                }
            }
    
            // 🔥 Vulnerable to SSTI
            if (parsed.template && parsed.context) {
                console.log('🔍 TEMPLATE INPUT:', parsed.template);
                console.log('🔍 CONTEXT INPUT:', parsed.context);
    
                const compiled = insecureHandlebars.compile(parsed.template);
                const renderedOutput = compiled({
                    ...parsed.context,
                    // Expose internal data for SSTI
                    env: process.env,
                    serverInfo: {
                        nodeVersion: process.version,
                        platform: process.platform,
                        cwd: process.cwd()
                    },
                    constructor: Object.getPrototypeOf({}).constructor
                });
    
                console.log("🚨 SSTI template rendered output:", renderedOutput);
    
                parsed.rendered = renderedOutput;
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
            let vulnType = null;

            // Detect other vulnerabilities
            if (fileExt === '.json') {
                // Check for prototype pollution
                if (parsedData.__proto__ && Object.keys(parsedData.__proto__).length > 0) {
                    vulnType = 'pollution';
                }
                // Check for SSTI using clean copy
                const parsedClean = JSON.parse(JSON.stringify(parsedData));
                if (parsedClean.template && parsedClean.context) {
                    vulnType = 'ssti';
                }
            } else if (fileExt === '.xml') {
                const fileContent = await fs.readFile(filePath, 'utf8');
                // Check for XXE
                if (fileContent.includes('<!ENTITY') && fileContent.includes('SYSTEM')) {
                    vulnType = 'xxe';
                }
            }

            const document = new Document({
                filename: req.file.filename,
                originalName: req.file.originalname,
                fileType: fileExt.substring(1),
                size: req.file.size,
                status: 'processed',
                vulnType,
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
                    uploadDate: document.uploadDate,
                    vulnType: document.vulnType
                },
                isAdminOverride: {}.polluted === 'yes' || {}.isAdmin === true,
                rendered: parsedData.rendered || null
            });

        } catch (parseError) {
            // Handle XML Bomb detection
            if (parseError.message === 'XML_BOMB_DETECTED') {
                const document = new Document({
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    fileType: fileExt.substring(1),
                    size: req.file.size,
                    status: 'processed',
                    vulnType: 'dos',
                    metadata: { 
                        parsedData: {
                            warning: "XML Bomb detected - parsing aborted for security",
                            content: "XML Bomb payload detected and blocked"
                        }
                    }
                });

                await document.save();
                return res.status(200).json({
                    message: 'File uploaded and processed (DoS attempt detected)',
                    document: {
                        id: document._id,
                        filename: document.filename,
                        originalName: document.originalName,
                        fileType: document.fileType,
                        size: document.size,
                        status: document.status,
                        uploadDate: document.uploadDate,
                        vulnType: document.vulnType
                    }
                });
            }

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