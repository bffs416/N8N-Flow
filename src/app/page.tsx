
'use client';

import {useState, useEffect, useMemo} from 'react';
import type {Workflow} from '@/types';
import {PageHeader} from '@/components/page-header';
import {FileUploader} from '@/components/file-uploader';
import {WorkflowList} from '@/components/workflow-list';
import {analyzeSingleWorkflow, runSimilarityAnalysis} from '@/app/actions';
import {useToast} from '@/hooks/use-toast';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {UploadCloud} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import preAnalyzedWorkflows from '@/lib/pre-analyzed-workflows.json';
import {SearchInput} from '@/components/search-input';

const WORKFLOWS_STORAGE_KEY = 'n8n-insights-workflows';

export default function Home() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSimilarityRunning, setIsSimilarityRunning] = useState(false);
  const [progress, setProgress] = useState({current: 0, total: 0});
  const [searchQuery, setSearchQuery] = useState('');

  const {toast} = useToast();

  // Load workflows from pre-analyzed file on initial render
  useEffect(() => {
    try {
      // Always load the pre-analyzed workflows on initial load for consistency
      setWorkflows(preAnalyzedWorkflows as Workflow[]);
    } catch (error) {
      console.error('Failed to load pre-analyzed workflows', error);
      toast({
        variant: 'destructive',
        title: 'Error al cargar',
        description: 'No se pudieron cargar los flujos de trabajo iniciales.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);


  // Save workflows to localStorage whenever they change
  useEffect(() => {
    // We don't save during initial loading
    if (!isLoading) {
      try {
        localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(workflows));
      } catch (error) {
        console.error('Failed to save workflows to localStorage', error);
        toast({
          variant: 'destructive',
          title: 'Error al guardar',
          description: 'No se pudieron guardar los flujos de trabajo.',
        });
      }
    }
  }, [workflows, isLoading, toast]);
  
  const handleFilesUpload = async (
    files: {fileName: string; content: string}[]
  ) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress({current: 0, total: files.length});

    // Use a copy of the current workflows to add new ones
    let processedWorkflows: Workflow[] = [...workflows];

    // Process files one by one
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // We pass the current list of processed workflows to get the next correct ID
        const newWorkflow = await analyzeSingleWorkflow(file, processedWorkflows);
        
        // Add the new workflow to our temporary list
        processedWorkflows.push(newWorkflow);

        // Update progress and state
        setProgress(p => ({...p, current: i + 1}));

      } catch (e) {
        console.error(e);
        toast({
          variant: 'destructive',
          title: `Falló el Análisis para ${file.fileName}`,
          description:
            e instanceof Error ? e.message : 'Error inesperado.',
        });
        // Continue to next file even if one fails
      }
    }

    // Set all workflows at once after the loop
    setWorkflows(processedWorkflows);
    
    setIsProcessing(false);

    // Once all files are processed, run similarity analysis on the complete list
    if (processedWorkflows.length > workflows.length) { // Check if new workflows were actually added
      setIsSimilarityRunning(true);
      toast({
        title: 'Análisis de Similitud en Progreso',
        description: 'Calculando similitudes entre todos los flujos de trabajo.',
      });

      try {
        const finalWorkflows = await runSimilarityAnalysis(processedWorkflows);
        setWorkflows(finalWorkflows);
        toast({
          title: 'Análisis de Similitud Completo',
          description: `Se han actualizado las relaciones entre los flujos.`,
        });
      } catch (e) {
        console.error(e);
        toast({
          variant: 'destructive',
          title: 'Falló el Análisis de Similitud',
          description: 'Ocurrió un error al comparar los flujos.',
        });
      } finally {
        setIsSimilarityRunning(false);
      }
    } else if (files.length > 0) { // Files were processed but no new workflows were added (e.g., all failed)
       toast({
          title: 'Análisis Finalizado',
          description: `No se agregaron nuevos flujos válidos.`,
        });
    }
  };


  const handleClearWorkflows = () => {
    setWorkflows([]);
    try {
      localStorage.setItem(WORKFLOWS_STORAGE_KEY, '[]');
      toast({
        title: 'Flujos de trabajo eliminados',
        description:
          'Todos los flujos de trabajo analizados han sido eliminados.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al limpiar',
        description: 'No se pudieron eliminar los flujos de trabajo.',
      });
    }
  };
  
  const anyTaskRunning = isProcessing || isSimilarityRunning || isLoading;

  const filteredWorkflows = useMemo(() => {
    if (!searchQuery) return workflows;

    const query = searchQuery.toLowerCase();
    return workflows.filter(wf => 
      `#${wf.displayId}`.includes(query) ||
      wf.flowName.toLowerCase().includes(query) ||
      wf.shortDescription.toLowerCase().includes(query) ||
      wf.mainArea.toLowerCase().includes(query) ||
      wf.mainFunction.toLowerCase().includes(query) ||
      wf.dataOrigins.some(o => o.toLowerCase().includes(query)) ||
      wf.automationDestinations.some(d => d.toLowerCase().includes(query)) ||
      wf.keyNodes.some(n => n.toLowerCase().includes(query))
    );
  }, [workflows, searchQuery]);


  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        onClear={handleClearWorkflows}
        hasWorkflows={workflows.length > 0}
      />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          <Card id="analyzer">
            <CardHeader>
              <CardTitle>Analizador de Flujos</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploader onFilesUploaded={handleFilesUpload} disabled={anyTaskRunning} />
            </CardContent>
          </Card>

          {isProcessing && (
            <Card>
              <CardContent className="p-6">
                <p className="text-center font-medium mb-2">
                  Analizando {progress.current} de {progress.total} flujos...
                </p>
                <Progress value={(progress.current / progress.total) * 100} />
              </CardContent>
            </Card>
          )}
          {isSimilarityRunning && !isProcessing && (
             <Card>
              <CardContent className="p-6 text-center">
                 <p className="font-medium">Calculando similitudes entre todos los flujos de trabajo...</p>
                 <p className="text-sm text-muted-foreground">Esto puede tardar un momento.</p>
              </CardContent>
            </Card>
          )}

          {workflows.length > 0 && (
            <div className="sticky top-[65px] z-10 bg-background/80 backdrop-blur-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2">
                <SearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Buscar en ${workflows.length} flujos...`}
                  disabled={anyTaskRunning}
                  onClear={() => setSearchQuery('')}
                />
            </div>
          )}


          {workflows.length === 0 && !anyTaskRunning ? (
            <Card className="w-full">
              <CardHeader>
                 <CardTitle>Flujos Analizados (0)</CardTitle>
              </CardHeader>
              <CardContent className="py-20 flex flex-col items-center justify-center text-center">
                <UploadCloud className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground">
                  Esperando Flujos de Trabajo
                </h3>
                <p className="text-muted-foreground mt-2">
                  Sube tus archivos de flujo de trabajo de n8n para comenzar el
                  análisis.
                </p>
              </CardContent>
            </Card>
          ) : (
            <WorkflowList
              workflows={filteredWorkflows}
              setWorkflows={setWorkflows}
              isLoading={anyTaskRunning}
              totalWorkflows={workflows.length}
              searchQuery={searchQuery}
            />
          )}
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>Construido con Next.js y Genkit</p>
      </footer>
    </div>
  );
}
