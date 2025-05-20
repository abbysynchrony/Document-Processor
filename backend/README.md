# Document Processor Backend

This is the backend server for the Document Processor project. It handles file uploads, document processing, and PDF generation.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/document-processor
NODE_ENV=development
```

3. Start the development server:
```bash
npm start
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/upload` - Upload and process documents (XML/JSON)

## Development

The server uses:
- Express.js for the web server
- MongoDB for data storage
- xml2js for XML parsing
- pdfkit for PDF generation
- handlebars for templating 