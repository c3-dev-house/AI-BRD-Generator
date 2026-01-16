import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface UploadResponse {
  success: boolean;
  documentId: string;
  analysis: {
    fileName: string;
    fileSize: string;
    topic: string;
    wordCount: number;
    characterCount: number;
    extractedTextPreview: string;
    message: string;
  };
}

export interface BRDResponse {
  success: boolean;
  brd: {
    content: string;
    topic: string;
    model: string;
    tokensUsed: number;
    generatedAt: string;
    sourceDocument: {
      name: string;
      wordCount: number;
    };
  };
  message: string;
}

export interface DocxResponse {
  success: boolean;
  file: {
    filename: string;
    size: string;
    downloadUrl: string;
  };
  message: string;
}

export const uploadDocument = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const generateBRD = async (documentId: string): Promise<BRDResponse> => {
  const response = await api.post<BRDResponse>('/generate-brd', { documentId });
  return response.data;
};

export const generateDocx = async (brdContent: string, topic: string, documentId?: string): Promise<DocxResponse> => {
  const response = await api.post<DocxResponse>('/generate-docx', {
    brdContent,
    topic,
    documentId,
  });
  return response.data;
};

export const getDownloadUrl = (filename: string): string => {
  return `${API_BASE_URL}/download/${filename}`;
};
