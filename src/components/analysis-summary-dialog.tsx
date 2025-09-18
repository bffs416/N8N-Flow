
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
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export interface AnalysisResult {
  fileName: string;
  status: 'success' | 'error' | 'skipped';
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
  const skippedCount = results.filter(r => r.status === 'skipped').length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Resumen del Análisis</DialogTitle>
          <DialogDescription>
            Se procesaron {results.length} archivo(s). {successCount} con éxito, {errorCount} con errores, {skippedCount} omitidos.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] my-4">
          <div className="space-y-3 pr-6">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-start p-3 border rounded-md"
              >
                {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5" />}
                {result.status === 'error' && <XCircle className="h-5 w-5 text-red-500 mr-3 shrink-0 mt-0.5" />}
                {result.status === 'skipped' && <Info className="h-5 w-5 text-yellow-500 mr-3 shrink-0 mt-0.5" />}
                
                <div className="flex-grow">
                  <p className="font-medium text-sm break-all">{result.fileName}</p>
                  {result.status === 'error' && (
                    <p className="text-xs text-red-400 mt-1 break-words">
                      Error: {result.message}
                    </p>
                  )}
                  {result.status === 'skipped' && (
                    <p className="text-xs text-yellow-400 mt-1 break-words">
                      Omitido: {result.message}
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

    