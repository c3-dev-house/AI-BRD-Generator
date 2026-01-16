'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/file-upload';
import { AnalysisDisplay } from '@/components/analysis-display';
import { BRDResult } from '@/components/brd-result';
import { Spinner } from '@/components/spinner';
import { uploadDocument, generateBRD } from '@/lib/api';
import type { UploadResponse, BRDResponse } from '@/lib/api';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [brdResult, setBrdResult] = useState<BRDResponse['brd'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileSelect = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      setUploadResult(null);
      setBrdResult(null);
      
      // Step 1: Upload and extract text
      const uploadResponse = await uploadDocument(file);
      setUploadResult(uploadResponse);
      
      // Step 2: Generate BRD
      const brdResponse = await generateBRD(uploadResponse.documentId);
      setBrdResult(brdResponse.brd);
      
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            AI BRD Generator
          </h1>
          <p className="text-muted-foreground">
            Transform your documents into comprehensive Business Requirements Documents using AI
          </p>
        </div>
        
        <div className="space-y-6">
          <FileUpload onFileSelect={handleFileSelect} isLoading={isProcessing} />
          
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {isProcessing && (
            <div className="text-center">
              <Spinner />
              <p className="text-muted-foreground mt-4">
                Processing your document and generating BRD...
              </p>
            </div>
          )}
          
          {uploadResult && !isProcessing && (
            <AnalysisDisplay analysis={uploadResult.analysis} />
          )}
          
          {brdResult && !isProcessing && (
            <BRDResult brd={brdResult} documentId={uploadResult?.documentId} />
          )}
        </div>
      </div>
    </main>
  );
}
