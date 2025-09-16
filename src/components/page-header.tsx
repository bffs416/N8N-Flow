import React from 'react';
import { N8nInsightsLogo } from './icons';
import { Button } from './ui/button';
import { Trash2, UploadCloud } from 'lucide-react';
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

interface PageHeaderProps {
  onClear: () => void;
  hasWorkflows: boolean;
}


export const PageHeader = ({ onClear, hasWorkflows }: PageHeaderProps) => {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <N8nInsightsLogo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">n8n Insights</h1>
          </div>
          {hasWorkflows && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => alert('Funcionalidad no implementada.')} disabled>
                  <UploadCloud className="h-4 w-4 mr-2" />
                  Cargar a Supabase
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar todo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminarán permanentemente todos los flujos de trabajo analizados de tu almacenamiento local.
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
    </header>
  );
};
