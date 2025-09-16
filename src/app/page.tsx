'use client';

import { useState, useEffect } from 'react';
import type { Workflow } from '@/types';
import { PageHeader } from '@/components/page-header';
import { FileUploader } from '@/components/file-uploader';
import { WorkflowList } from '@/components/workflow-list';
import { analyzeWorkflows } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';

const WORKFLOWS_STORAGE_KEY = 'n8n-insights-workflows';

export default function Home() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load workflows from localStorage on initial render
  useEffect(() => {
    try {
      const storedWorkflows = localStorage.getItem(WORKFLOWS_STORAGE_KEY);
      if (storedWorkflows) {
        setWorkflows(JSON.parse(storedWorkflows));
      }
    } catch (error) {
      console.error("Failed to load workflows from localStorage", error);
      toast({
        variant: 'destructive',
        title: 'Error al cargar',
        description: 'No se pudieron cargar los flujos de trabajo guardados.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Save workflows to localStorage whenever they change
  useEffect(() => {
    // We don't save during the initial load
    if (!isLoading) {
      try {
        localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(workflows));
      } catch (error) {
        console.error("Failed to save workflows to localStorage", error);
        toast({
          variant: 'destructive',
          title: 'Error al guardar',
          description: 'No se pudieron guardar los flujos de trabajo.',
        });
      }
    }
  }, [workflows, isLoading, toast]);


  const handleFilesUpload = async (files: { fileName: string; content: string }[]) => {
    if (files.length === 0) return;
    setIsLoading(true);
    try {
      const updatedWorkflows = await analyzeWorkflows(files, workflows);
      setWorkflows(updatedWorkflows);
      toast({
        title: 'Análisis Completo',
        description: `${files.length} nuevo(s) flujo(s) de trabajo ha(n) sido analizado(s) y agregado(s).`,
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Falló el Análisis',
        description: 'Ocurrió un error inesperado al analizar los flujos de trabajo. Por favor, revisa la consola para más detalles.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearWorkflows = () => {
    setWorkflows([]);
    toast({
      title: 'Flujos de trabajo eliminados',
      description: 'Todos los flujos de trabajo analizados han sido eliminados.',
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader onClear={handleClearWorkflows} hasWorkflows={workflows.length > 0} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <FileUploader onFilesUploaded={handleFilesUpload} disabled={isLoading} />
          {workflows.length === 0 && !isLoading ? (
            <Card className="w-full">
              <CardContent className="py-20 flex flex-col items-center justify-center text-center">
                <UploadCloud className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground">Esperando Flujos de Trabajo</h3>
                <p className="text-muted-foreground mt-2">
                  Sube tus archivos de flujo de trabajo de n8n para comenzar el análisis.
                </p>
              </CardContent>
            </Card>
          ) : (
            <WorkflowList workflows={workflows} isLoading={isLoading} />
          )}
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>Construido con Next.js y Genkit</p>
      </footer>
    </div>
  );
}
