# AI BRD Generator - Frontend

Frontend application for the AI BRD Generator system.

## Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Create a `.env.local` file based on `.env.example`:
\`\`\`bash
cp .env.example .env.local
\`\`\`

3. Configure the backend API URL in `.env.local`:
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:3001/api
\`\`\`

## Running the Application

Development mode:
\`\`\`bash
npm run dev
\`\`\`

The app will be available at `http://localhost:3000`

Production build:
\`\`\`bash
npm run build
npm start
\`\`\`

## Features

- Upload documents in multiple formats (PDF, DOCX, TXT, CSV, JSON, Excel, etc.)
- View document analysis and statistics
- Generate comprehensive Business Requirements Documents using AI
- Download generated BRD as Word (.docx) file
- Clean, responsive UI with loading states and error handling
\`\`\`
