'use client';

import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

const SUPPORTED_FORMATS = [
  '.pdf', '.docx', '.doc', '.txt', '.md', '.csv', '.json', '.xlsx', '.xls'
];

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);
  
  const onSubmit = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Upload your source document to generate a comprehensive Business Requirements Document
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="file" className="block text-sm font-medium text-foreground">
              Select File
            </label>
            <input
              id="file"
              type="file"
              accept={SUPPORTED_FORMATS.join(',')}
              {...register('file', { required: 'Please select a file' })}
              onChange={handleFileChange}
              disabled={isLoading}
              className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
            />
            {errors.file && (
              <p className="text-sm text-destructive">{errors.file.message as string}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Supported formats: {SUPPORTED_FORMATS.join(', ')} (Max 50MB)
            </p>
          </div>
          
          {selectedFile && (
            <div className="p-4 bg-muted rounded-lg space-y-1">
              <p className="text-sm font-medium text-foreground">Selected File:</p>
              <p className="text-sm text-muted-foreground">Name: {selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">Size: {formatFileSize(selectedFile.size)}</p>
              <p className="text-sm text-muted-foreground">
                Type: {selectedFile.name.split('.').pop()?.toUpperCase()}
              </p>
            </div>
          )}
          
          <Button
            type="submit"
            disabled={!selectedFile || isLoading}
            className="w-full"
          >
            {isLoading ? 'Processing...' : 'Generate BRD'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
