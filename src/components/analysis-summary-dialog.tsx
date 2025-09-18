
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export interface AnalysisResult {
  fileName: string;
  status: 'success' | 'error';
  message?: string;
}

interface AnalysisSummaryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  results: AnalysisResult[];
}

export function AnalysisSummaryDialog({
  isOpen,
  onOpenChange,
  results,
}: AnalysisSummaryDialogProps) {
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Resumen del Análisis</DialogTitle>
          <DialogDescription>
            Se procesaron {results.length} archivo(s). {successCount} con éxito, {errorCount} con errores.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] my-4">
          <div className="space-y-3 pr-6">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-start p-3 border rounded-md"
              >
                {result.status === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-3 shrink-0 mt-0.5" />
                )}
                <div className="flex-grow">
                  <p className="font-medium text-sm break-all">{result.fileName}</p>
                  {result.status === 'error' && (
                    <p className="text-xs text-red-400 mt-1 break-words">
                      Error: {result.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    