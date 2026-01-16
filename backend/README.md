# AI BRD Generator - Backend

Backend API for the AI BRD Generator system.

## Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Create a `.env` file based on `.env.example`:
\`\`\`bash
cp .env.example .env
\`\`\`

3. Add your OpenAI API key to the `.env` file:
\`\`\`
OPENAI_API_KEY=sk-...
PORT=3001
\`\`\`

## Running the Server

Development mode (with auto-reload):
\`\`\`bash
npm run dev
\`\`\`

Production mode:
\`\`\`bash
npm start
\`\`\`

The server will start on `http://localhost:3001`

## API Endpoints

- `GET /health` - Health check
- `POST /api/upload` - Upload and process document
- `POST /api/generate-brd` - Generate BRD using AI
- `POST /api/generate-docx` - Create Word document
- `GET /api/download/:filename` - Download generated DOCX file

## Supported File Formats

- PDF (.pdf)
- Microsoft Word (.docx, .doc)
- Text files (.txt, .md)
- CSV (.csv)
- JSON (.json)
- Excel (.xlsx, .xls)
