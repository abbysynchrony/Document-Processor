const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true,
        enum: ['xml', 'json']
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    size: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processed', 'error'],
        default: 'pending'
    },
    metadata: {
        parsedData: {
            type: mongoose.Schema.Types.Mixed
        }
    }
});

module.exports = mongoose.model('Document', documentSchema); 