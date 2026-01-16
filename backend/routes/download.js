import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { generateDocx } from '../services/docxGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Generate DOCX file from BRD content
 */
router.post('/generate-docx', async (req, res, next) => {
  try {
    const { brdContent, topic, documentId } = req.body;
    
    if (!brdContent) {
      return res.status(400).json({ error: 'brdContent is required' });
    }
    
    if (!topic) {
      return res.status(400).json({ error: 'topic is required' });
    }
    
    console.log('Generating DOCX file...');
    
    const result = await generateDocx(brdContent, topic, documentId);
    
    res.json({
      success: true,
      file: {
        filename: result.filename,
        size: `${(result.size / 1024).toFixed(2)} KB`,
        downloadUrl: `/api/download/${result.filename}`
      },
      message: 'DOCX file generated successfully'
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Download generated DOCX file
 */
router.get('/download/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const outputDir = path.join(__dirname, '../output');
    const filepath = path.join(outputDir, filename);
    
    // Check if file exists
    try {
      await fs.access(filepath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    const fileBuffer = await fs.readFile(filepath);
    res.send(fileBuffer);
    
    // Clean up file after 1 minute
    setTimeout(async () => {
      try {
        await fs.unlink(filepath);
        console.log(`Cleaned up file: ${filename}`);
      } catch (error) {
        console.error('File cleanup error:', error);
      }
    }, 60000);
    
  } catch (error) {
    next(error);
  }
});

export default router;
