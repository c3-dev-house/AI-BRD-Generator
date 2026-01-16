'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalysisDisplayProps {
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

export function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Analysis</CardTitle>
        <CardDescription>{analysis.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">File Name</p>
            <p className="text-sm text-foreground">{analysis.fileName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">File Size</p>
            <p className="text-sm text-foreground">{analysis.fileSize}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Word Count</p>
            <p className="text-sm text-foreground">{analysis.wordCount.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Characters</p>
            <p className="text-sm text-foreground">{analysis.characterCount.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Topic</p>
          <p className="text-sm text-foreground">{analysis.topic}</p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Preview</p>
          <div className="p-3 bg-muted rounded text-xs text-muted-foreground max-h-32 overflow-y-auto">
            {analysis.extractedTextPreview}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
