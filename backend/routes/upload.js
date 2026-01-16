import express from 'express';
import { upload } from '../middleware/upload.js';
import { extractTextFromFile, cleanupFile } from '../utils/extractors.js';
import { saveDocument } from '../utils/storage.js';

const router = express.Router();

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { path: filePath, originalname, size, mimetype } = req.file;
    
    console.log(`Processing file: ${originalname} (${(size / 1024).toFixed(2)} KB)`);
    
    // Extract text from the uploaded file
    const extractedText = await extractTextFromFile(filePath, originalname);
    
    // Clean up the temporary file
    await cleanupFile(filePath);
    
    // Get first non-empty line as topic
    const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
    const topic = lines[0]?.substring(0, 100) || 'Untitled Document';
    
    // Save document to temporary storage
    const documentId = saveDocument(extractedText, {
      originalName: originalname,
      size,
      mimetype,
      topic,
      extractedAt: new Date().toISOString()
    });
    
    // Create analysis summary
    const wordCount = extractedText.split(/\s+/).length;
    const charCount = extractedText.length;
    
    res.json({
      success: true,
      documentId,
      analysis: {
        fileName: originalname,
        fileSize: `${(size / 1024).toFixed(2)} KB`,
        topic,
        wordCount,
        characterCount: charCount,
        extractedTextPreview: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
        message: 'Document processed successfully. Ready to generate BRD.'
      }
    });
    
  } catch (error) {
    // Clean up file if extraction failed
    if (req.file) {
      await cleanupFile(req.file.path);
    }
    next(error);
  }
});

export default router;
