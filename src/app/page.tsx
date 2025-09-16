
'use client';

import {useState, useEffect, useMemo} from 'react';
import type {Workflow} from '@/types';
import {PageHeader} from '@/components/page-header';
import {FileUploader} from '@/components/file-uploader';
import {WorkflowList} from '@/components/workflow-list';
import {analyzeSingleWorkflow, runSimilarityAnalysis, saveWorkflowsToFile} from '@/app/actions';
import {useToast} from '@/hooks/use-toast';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {UploadCloud, Loader2} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import preAnalyzedWorkflows from '@/lib/pre-analyzed-workflows.json';
import {SearchInput} from '@/components/search-input';

export default function Home() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const {toast} = useToast();

  useEffect(() => {
    try {
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

  const handleFilesUpload = async (
    files: {fileName: string; content: string}[]
  ) => {
    if (files.length === 0) return;

    setIsLoading(true);
    toast({
        title: 'Análisis en progreso...',
        description: `Analizando ${files.length} nuevo(s) flujo(s).`,
    });

    try {
      // 1. Analyze all new files in parallel
      const analysisPromises = files.map(file => 
        analyzeSingleWorkflow(file, workflows) // Pass existing workflows to get next ID
          .catch(e => { // Catch errors individually so one failure doesn't stop all
            console.error(e);
            toast({
              variant: 'destructive',
              title: `Falló el Análisis para ${file.fileName}`,
              description: e instanceof Error ? e.message : 'Error inesperado.',
            });
            return null; // Return null for failed analyses
          })
      );
      
      const newWorkflows = (await Promise.all(analysisPromises)).filter(Boolean) as Workflow[];

      if (newWorkflows.length > 0) {
        // 2. Combine new workflows with existing ones and update the state
        setWorkflows(prevWorkflows => [...prevWorkflows, ...newWorkflows]);
        setHasUnsavedChanges(true);

        toast({
          title: 'Análisis Completo',
          description: `Se agregaron ${newWorkflows.length} nuevo(s) flujo(s).`,
        });

      } else {
         toast({
          title: 'Análisis Finalizado',
          description: `No se agregaron nuevos flujos válidos.`,
        });
      }
    } catch (error) {
      console.error('An error occurred during the upload process:', error);
      toast({
        variant: 'destructive',
        title: 'Error en el Proceso',
        description: 'Ocurrió un error inesperado al analizar los flujos.',
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleClearWorkflows = () => {
    setWorkflows(preAnalyzedWorkflows as Workflow[]);
    setHasUnsavedChanges(false);
    toast({
      title: 'Flujos de trabajo restablecidos',
      description: 'La lista ha vuelto a su estado inicial.',
    });
  };

  const handleSaveChanges = async () => {
    const result = await saveWorkflowsToFile(workflows);
    if (result.success) {
      setHasUnsavedChanges(false);
      toast({
        title: '¡Guardado!',
        description: 'Los flujos de trabajo han sido guardados permanentemente.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error al Guardar',
        description: result.error || 'No se pudieron guardar los cambios en el archivo.',
      });
    }
  };
  
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
        onSave={handleSaveChanges}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          <Card id="analyzer">
            <CardHeader>
              <CardTitle>Analizador de Flujos</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploader onFilesUploaded={handleFilesUpload} disabled={isLoading} />
            </CardContent>
          </Card>

          {isLoading && workflows.length > 0 && (
             <Card>
              <CardContent className="p-6 text-center flex items-center justify-center gap-3">
                 <Loader2 className="h-5 w-5 animate-spin"/>
                 <p className="font-medium">Analizando flujos de trabajo...</p>
              </CardContent>
            </Card>
          )}

          {workflows.length > 0 && (
            <div className="sticky top-[65px] z-10 bg-background/80 backdrop-blur-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2">
                <SearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Buscar en ${workflows.length} flujos...`}
                  disabled={isLoading}
                  onClear={() => setSearchQuery('')}
                />
            </div>
          )}

          {isLoading && workflows.length === 0 ? (
             <Card>
              <CardHeader>
                 <CardTitle>Cargando Flujos...</CardTitle>
              </CardHeader>
              <CardContent className="py-20 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-16 w-16 text-muted-foreground mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-foreground">
                  Inicializando...
                </h3>
                <p className="text-muted-foreground mt-2">
                  Cargando la base de flujos pre-analizados.
                </p>
              </CardContent>
            </Card>
          ) : workflows.length === 0 ? (
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
              isLoading={isLoading}
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
