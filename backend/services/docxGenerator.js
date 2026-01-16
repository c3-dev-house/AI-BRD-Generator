import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse markdown-style content and convert to DOCX elements
 */
const parseContentToDocx = (content) => {
  const lines = content.split('\n');
  const elements = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line.trim()) {
      elements.push(new Paragraph({ text: '' }));
      continue;
    }
    
    // H1 Heading (# Title)
    if (line.startsWith('# ')) {
      elements.push(
        new Paragraph({
          text: line.replace('# ', ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );
    }
    // H2 Heading (## Title)
    else if (line.startsWith('## ')) {
      elements.push(
        new Paragraph({
          text: line.replace('## ', ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 }
        })
      );
    }
    // H3 Heading (### Title)
    else if (line.startsWith('### ')) {
      elements.push(
        new Paragraph({
          text: line.replace('### ', ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 }
        })
      );
    }
    // Bullet points (- item or * item)
    else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        new Paragraph({
          text: line.trim().replace(/^[*-]\s/, ''),
          bullet: { level: 0 },
          spacing: { before: 50, after: 50 }
        })
      );
    }
    // Bold text (**text**)
    else if (line.includes('**')) {
      const parts = line.split('**');
      const runs = parts.map((part, idx) => 
        new TextRun({
          text: part,
          bold: idx % 2 === 1
        })
      );
      elements.push(
        new Paragraph({
          children: runs,
          spacing: { before: 100, after: 100 }
        })
      );
    }
    // Regular paragraph
    else {
      elements.push(
        new Paragraph({
          text: line,
          spacing: { before: 100, after: 100 }
        })
      );
    }
  }
  
  return elements;
};

/**
 * Generate a Word document from BRD content
 */
export const generateDocx = async (brdContent, topic, documentId) => {
  try {
    // Ensure output directory exists
    const outputDir = path.join(__dirname, '../output');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Parse content to DOCX elements
    const docElements = parseContentToDocx(brdContent);
    
    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title page
            new Paragraph({
              text: 'Business Requirements Document',
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
              text: topic,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            new Paragraph({
              text: `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 800 }
            }),
            new Paragraph({
              text: '',
              pageBreakBefore: true
            }),
            // Main content
            ...docElements
          ]
        }
      ]
    });
    
    // Generate filename
    const timestamp = Date.now();
    const sanitizedTopic = topic.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    const filename = `BRD_${sanitizedTopic}_${timestamp}.docx`;
    const filepath = path.join(outputDir, filename);
    
    // Convert to buffer
    const buffer = await doc.toBuffer();
    
    // Save to file
    await fs.writeFile(filepath, buffer);
    
    console.log(`DOCX file created: ${filename}`);
    
    return {
      filename,
      filepath,
      size: buffer.length
    };
    
  } catch (error) {
    throw new Error(`DOCX generation failed: ${error.message}`);
  }
};
