import { v4 as uuidv4 } from 'uuid';

// In-memory storage for temporary document data
// In production, use Redis or a database
const documentStore = new Map();

export const saveDocument = (extractedText, metadata) => {
  const documentId = uuidv4();
  documentStore.set(documentId, {
    text: extractedText,
    metadata,
    timestamp: Date.now()
  });
  
  // Auto-cleanup after 1 hour
  setTimeout(() => {
    documentStore.delete(documentId);
  }, 60 * 60 * 1000);
  
  return documentId;
};

export const getDocument = (documentId) => {
  return documentStore.get(documentId);
};

export const deleteDocument = (documentId) => {
  return documentStore.delete(documentId);
};

// Clean up old documents periodically
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [id, doc] of documentStore.entries()) {
    if (now - doc.timestamp > oneHour) {
      documentStore.delete(id);
    }
  }
}, 15 * 60 * 1000); // Check every 15 minutes
