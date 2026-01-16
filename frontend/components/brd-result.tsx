'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateDocx, getDownloadUrl } from '@/lib/api';
import type { BRDResponse, DocxResponse } from '@/lib/api';

interface BRDResultProps {
  brd: BRDResponse['brd'];
  documentId?: string;
}

export function BRDResult({ brd, documentId }: BRDResultProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [docxFile, setDocxFile] = useState<DocxResponse['file'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleGenerateDocx = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const response = await generateDocx(brd.content, brd.topic, documentId);
      setDocxFile(response.file);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate DOCX file');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDownload = () => {
    if (docxFile) {
      window.open(getDownloadUrl(docxFile.filename), '_blank');
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Requirements Document</CardTitle>
        <CardDescription>
          Generated using {brd.model} ({brd.tokensUsed.toLocaleString()} tokens)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Topic</p>
            <p className="text-sm text-foreground">{brd.topic}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Generated</p>
            <p className="text-sm text-foreground">
              {new Date(brd.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">BRD Content Preview</p>
          <div className="p-4 bg-muted rounded max-h-96 overflow-y-auto">
            <pre className="text-xs text-foreground whitespace-pre-wrap">
              {brd.content}
            </pre>
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded text-sm">
            {error}
          </div>
        )}
        
        {!docxFile ? (
          <Button
            onClick={handleGenerateDocx}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Generating DOCX...' : 'Generate DOCX File'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded">
              <p className="text-sm font-medium">DOCX file generated successfully!</p>
              <p className="text-xs mt-1">File: {docxFile.filename} ({docxFile.size})</p>
            </div>
            <Button onClick={handleDownload} className="w-full">
              Download BRD (.docx)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
