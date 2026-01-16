import express from 'express';
import { getDocument } from '../utils/storage.js';
import { generateBRD } from '../services/brdGenerator.js';

const router = express.Router();

router.post('/generate-brd', async (req, res, next) => {
  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({ error: 'documentId is required' });
    }
    
    // Retrieve document from storage
    const document = getDocument(documentId);
    
    if (!document) {
      return res.status(404).json({ 
        error: 'Document not found or expired. Please upload the document again.' 
      });
    }
    
    console.log(`Generating BRD for document: ${documentId}`);
    console.log(`Document topic: ${document.metadata.topic}`);
    console.log(`Text length: ${document.text.length} characters`);
    
    // Generate BRD using OpenAI
    const brdResult = await generateBRD(document.text, document.metadata.topic);
    
    res.json({
      success: true,
      brd: {
        content: brdResult.content,
        topic: brdResult.topic,
        model: brdResult.model,
        tokensUsed: brdResult.tokensUsed,
        generatedAt: new Date().toISOString(),
        sourceDocument: {
          name: document.metadata.originalName,
          wordCount: document.text.split(/\s+/).length
        }
      },
      message: 'BRD generated successfully'
    });
    
  } catch (error) {
    next(error);
  }
});

export default router;
