const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Create mock sensitive files
const mockFiles = {
    'internal-config.xml': `<config>
        <db_user>admin</db_user>
        <db_pass>rootpass123</db_pass>
        <api_key>DEMO-KEY-4455</api_key>
    </config>`,
    'secrets.json': JSON.stringify({
        aws_key: 'AKIA-DEMO-KEY-1234',
        github_token: 'ghp_demo_token_5678',
        slack_webhook: 'https://hooks.slack.com/demo/1234'
    }, null, 2),
    'env.prod': `NODE_ENV=production
MONGODB_URI=mongodb://admin:rootpass123@localhost:27017
REDIS_URL=redis://localhost:6379
API_KEY=DEMO-KEY-4455`
};

// Ensure mock files exist in uploads directory
const ensureMockFiles = async () => {
    const uploadsDir = path.join(__dirname, '../uploads');
    for (const [filename, content] of Object.entries(mockFiles)) {
        const filePath = path.join(uploadsDir, filename);
        try {
            await fs.writeFile(filePath, content, 'utf8');
            console.log(`Created mock file: ${filename}`);
        } catch (err) {
            console.error(`Failed to create mock file ${filename}:`, err);
        }
    }
};

// Create mock files on startup
ensureMockFiles();

// 🔥 VULNERABLE: Allows path traversal like ../../etc/passwd
router.get('/', async (req, res) => {
    const fileParam = req.query.file;

    if (!fileParam) {
        return res.status(400).json({ error: 'Missing file parameter' });
    }

    // Detect path traversal attempt
    if (fileParam.includes('..')) {
        res.locals.vulnType = 'traversal';
    }

    // Vulnerable: no sanitization or base path enforcement
    const targetPath = path.join(__dirname, '../uploads', fileParam);

    try {
        // Check if it's a mock sensitive file
        const mockFile = mockFiles[path.basename(fileParam)];
        if (mockFile) {
            res.setHeader('Content-Type', 'text/plain');
            return res.send(mockFile);
        }

        // Otherwise try to read from filesystem
        const fileContent = await fs.readFile(targetPath, 'utf8');
        res.setHeader('Content-Type', 'text/plain');
        res.send(fileContent);
    } catch (err) {
        console.error('Export error:', err.message);
        res.status(500).json({ error: 'Could not read file' });
    }
});

module.exports = router; 