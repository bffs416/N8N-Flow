'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface FileUploaderProps {
  onFilesUploaded: (files: { fileName: string; content: string }[]) => void;
  disabled?: boolean;
}

export function FileUploader({ onFilesUploaded, disabled = false }: FileUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    const fileContents = await Promise.all(
      acceptedFiles.map(file => {
        return new Promise<{ fileName: string; content: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onabort = () => reject(new Error('File reading was aborted.'));
          reader.onerror = () => reject(new Error('Failed to read file.'));
          reader.onload = () => {
            resolve({
              fileName: file.name,
              content: reader.result as string,
            });
          };
          reader.readAsText(file);
        });
      })
    );

    onFilesUploaded(fileContents);
    setIsProcessing(false);
  }, [onFilesUploaded, disabled, isProcessing]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/plain': ['.txt'],
    },
    noClick: true,
    noKeyboard: true,
    disabled: disabled || isProcessing,
  });

  return (
    <Card>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
            isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
            disabled || isProcessing ? 'cursor-not-allowed opacity-60' : ''
          )}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            {(disabled || isProcessing) ? (
              <>
                <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
                <p className="mt-4 font-semibold text-foreground">Analizando flujos...</p>
                <p className="mt-2 text-sm text-muted-foreground">Por favor espera mientras procesamos los flujos de trabajo.</p>
              </>
            ) : isDragActive ? (
              <>
                <UploadCloud className="mx-auto h-12 w-12 text-primary" />
                <p className="mt-4 font-semibold text-primary">Suelta los archivos para iniciar el análisis</p>
              </>
            ) : (
              <>
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-semibold text-foreground">Arrastra y suelta tus flujos de trabajo de n8n aquí</p>
                <p className="mt-2 text-sm text-muted-foreground">Puedes seleccionar múltiples archivos .json y .txt</p>
                <Button onClick={open} disabled={disabled || isProcessing} className="mt-4">
                  O selecciona los archivos
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
