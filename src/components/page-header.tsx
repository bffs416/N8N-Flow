
import React from 'react';
import { N8nInsightsLogo } from './icons';
import { Button } from './ui/button';
import { Trash2, UploadCloud, Link as LinkIcon, Save, Wand2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';

interface PageHeaderProps {
  onClear: () => void;
  hasWorkflows: boolean;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  onRunSimilarityAnalysis: () => void;
  isLoading: boolean;
  totalWorkflows: number;
}


export const PageHeader = ({ 
  onClear, 
  hasWorkflows, 
  onSave, 
  hasUnsavedChanges, 
  onRunSimilarityAnalysis,
  isLoading,
  totalWorkflows,
}: PageHeaderProps) => {
  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <N8nInsightsLogo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">n8n Insights</h1>
          </div>
         <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
                <Link href="/#analyzer">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Analizador
                </Link>
            </Button>
            {hasWorkflows && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRunSimilarityAnalysis}
                  disabled={isLoading || totalWorkflows < 2}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Analizar Similitudes
                </Button>
                <Button variant="outline" size="sm" onClick={onSave} disabled={!hasUnsavedChanges || isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isLoading}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Restablecer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se restablecerá la lista de flujos a su estado original, perdiendo los nuevos análisis no guardados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={onClear}>Continuar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
