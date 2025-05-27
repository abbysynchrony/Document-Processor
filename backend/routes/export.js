const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// 🔥 VULNERABLE: Allows path traversal like ../../etc/passwd
router.get('/', async (req, res) => {
    const fileParam = req.query.file;

    if (!fileParam) {
        return res.status(400).json({ error: 'Missing file parameter' });
    }

    // Vulnerable: no sanitization or base path enforcement
    const targetPath = path.join(__dirname, '../uploads', fileParam);

    try {
        const fileContent = await fs.readFile(targetPath, 'utf8');
        res.setHeader('Content-Type', 'text/plain');
        res.send(fileContent);
    } catch (err) {
        console.error('Export error:', err.message);
        res.status(500).json({ error: 'Could not read file' });
    }
});

module.exports = router; 