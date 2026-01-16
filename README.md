# AI BRD Generator

An intelligent Business Requirements Document (BRD) generator powered by AI. Upload your documents and automatically generate comprehensive, enterprise-grade BRDs with AI analysis.

## Features

- **Multi-Format Support**: Upload PDF, DOCX, DOC, TXT, MD, CSV, JSON, XLSX, XLS files
- **AI-Powered Analysis**: Advanced document analysis using GPT-4o via Vercel AI SDK
- **Comprehensive BRDs**: Generate 15-section enterprise-ready Business Requirements Documents
- **Multiple Export Options**: 
  - Download as PDF
  - Download as DOCX (Microsoft Word)
  - Send via Email
- **Beautiful UI**: Modern, responsive interface with progress tracking
- **Real-time Processing**: Live status updates during document analysis

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **AI**: Vercel AI SDK with GPT-4o
- **Document Processing**: 
  - PDF parsing with `pdf-parse`
  - DOCX extraction with `mammoth`
  - Excel support with `exceljs`
- **Document Generation**:
  - PDF creation with `jspdf`
  - DOCX creation with `docx`
- **Email**: Resend API

## Prerequisites

- Node.js 18+ installed
- OpenAI API key (for AI generation)
- Resend API key (for email functionality - optional)

## Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
# Required for AI BRD Generation
OPENAI_API_KEY=your_openai_api_key_here

# Required for Email Functionality (optional if not using email)
RESEND_API_KEY=your_resend_api_key_here
\`\`\`

### Getting API Keys

1. **OpenAI API Key**:
   - Go to [platform.openai.com](https://platform.openai.com)
   - Sign up or log in
   - Navigate to API Keys section
   - Create a new API key
   - Copy and paste into `.env.local`

2. **Resend API Key** (optional, only needed for email):
   - Go to [resend.com](https://resend.com)
   - Sign up for a free account
   - Navigate to API Keys
   - Create a new API key
   - Copy and paste into `.env.local`

## Installation

1. **Clone or download the project**

2. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**:
   - Copy `.env.example` to `.env.local`
   - Add your API keys (see above)

4. **Run the development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open your browser**:
   - Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Step 1: Upload Document
- Click the upload area or drag and drop your document
- Supported formats: PDF, DOCX, DOC, TXT, MD, CSV, JSON, XLSX, XLS
- Maximum file size: 10MB

### Step 2: Review Analysis
- The system extracts and displays the document content
- Review the extracted text to ensure accuracy
- Click "Generate BRD" to proceed

### Step 3: AI Generation
- The AI analyzes your document using advanced prompts
- Generates a comprehensive 15-section BRD including:
  - Executive Summary
  - Business Background
  - Problem Statement
  - Goals and Objectives
  - Scope Definition
  - Stakeholder Analysis
  - Functional Requirements
  - Non-Functional Requirements
  - Business Process Changes
  - Assumptions and Constraints
  - Dependencies
  - Risk Analysis
  - Timeline and Milestones
  - Cost-Benefit Analysis
  - Approval and Sign-off

### Step 4: Download or Email
- **Download as PDF**: Click "Download PDF" button
- **Download as DOCX**: Click "Download DOCX" button
- **Send via Email**: 
  - Click "Send via Email"
  - Enter your email address
  - Click "Send"

## Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── upload/route.ts          # File upload endpoint
│   │   ├── generate-brd/route.ts    # AI BRD generation
│   │   ├── download/route.ts        # DOCX generation
│   │   ├── download-pdf/route.ts    # PDF generation
│   │   └── send-email/route.ts      # Email delivery
│   ├── page.tsx                      # Main application
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Global styles
├── components/
│   └── ui/                           # UI components (shadcn)
├── lib/
│   └── utils.ts                      # Utility functions
├── package.json
└── README.md
\`\`\`

## API Endpoints

### POST /api/upload
Uploads and extracts text from documents.

**Request**: FormData with file
**Response**: `{ extractedText: string }`

### POST /api/generate-brd
Generates BRD using AI.

**Request**: `{ extractedText: string }`
**Response**: `{ brd: string }`

### POST /api/download
Generates DOCX file.

**Request**: `{ brdContent: string }`
**Response**: DOCX file download

### POST /api/download-pdf
Generates PDF file.

**Request**: `{ brdContent: string }`
**Response**: PDF file download

### POST /api/send-email
Sends BRD via email.

**Request**: `{ email: string, brdContent: string, fileName: string }`
**Response**: `{ success: boolean }`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in 
3. Add environment variables  dashboard:
   - `OPENAI_API_KEY`
   - `RESEND_API_KEY` (if using email)
4. Deploy

### Other Platforms

Ensure your platform supports:
- Node.js 18+
- Next.js 16
- Environment variables

## Troubleshooting

### "API key not configured" error
- Ensure `OPENAI_API_KEY` is set in `.env.local`
- Restart the development server after adding env variables
- In production, add the key to your deployment platform's environment variables

### "Failed to extract text" error
- Check if the uploaded file is corrupted
- Ensure file format is supported
- Try a different file
- Check that the file contains readable text

### Email not sending
- Verify `RESEND_API_KEY` is correct in `.env.local`
- Check Resend dashboard for API usage limits
- Ensure email address format is valid
- Email functionality is optional - downloads still work without it

### PDF/DOCX download issues
- Check browser console for errors
- Ensure popup blockers are disabled
- Try a different browser
- Check that the BRD was generated successfully first

### Development server issues
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node -v` (should be 18+)

## Configuration

### Changing AI Model

Edit `app/api/generate-brd/route.ts`:

\`\`\`typescript
const { text } = await generateText({
  model: 'openai/gpt-4o', // Change to 'openai/gpt-3.5-turbo' for faster/cheaper
})
\`\`\`

### File Size Limits

Edit `app/api/upload/route.ts` to adjust the 10MB limit.

## Security Notes

- Never commit `.env.local` to version control (already in `.gitignore`)
- API keys are only used server-side in API routes
- File uploads are validated by type and size
- Temporary files are cleaned up automatically

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact support.
