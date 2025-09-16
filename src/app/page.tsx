
'use client';

import {useState, useEffect, useMemo} from 'react';
import type {Workflow} from '@/types';
import {PageHeader} from '@/components/page-header';
import {FileUploader} from '@/components/file-uploader';
import {WorkflowList} from '@/components/workflow-list';
import {analyzeSingleWorkflow, runBatchedSimilarityAnalysis, saveWorkflowsToFile, sendToSupabase} from '@/app/actions';
import {useToast} from '@/hooks/use-toast';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {UploadCloud, Loader2} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import preAnalyzedWorkflows from '@/lib/pre-analyzed-workflows.json';
import {SearchInput} from '@/components/search-input';

const BATCH_SIZE = 5;

export default function Home() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [initialWorkflows, setInitialWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState({ total: 0, current: 0, title: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [unanalysedUuids, setUnanalysedUuids] = useState<Set<string>>(new Set());

  const {toast} = useToast();

  useEffect(() => {
    try {
      const workflowsWithNumericId = (preAnalyzedWorkflows as any[]).map((wf, index) => ({
        ...wf,
        id: wf.id || index + 1,
        workflow_uuid: wf.workflow_uuid || `pre-analyzed-${index + 1}`
      }));
      setWorkflows(workflowsWithNumericId);
      setInitialWorkflows(workflowsWithNumericId);
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

  const getNextId = (currentWorkflows: Workflow[]): number => {
    if (currentWorkflows.length === 0) {
      return 1;
    }
    const maxId = Math.max(...currentWorkflows.map(wf => wf.id || 0));
    return maxId + 1;
  };

  const handleFilesUpload = async (
    files: {fileName: string; content: string}[]
  ) => {
    if (files.length === 0) return;

    setIsLoading(true);
    setAnalysisProgress({ total: files.length, current: 0, title: `Analizando ${files.length} nuevo(s) flujo(s)...` });

    const newUuids = new Set(unanalysedUuids);

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setAnalysisProgress(prev => ({ ...prev, current: i + 1 }));

        try {
            const analyzedData = await analyzeSingleWorkflow(file);
            setWorkflows(prevWorkflows => {
               const newId = getNextId(prevWorkflows);
               const newWorkflow = { ...analyzedData, id: newId };
               newUuids.add(newWorkflow.workflow_uuid);
               return [...prevWorkflows, newWorkflow];
            });
            setHasUnsavedChanges(true);
        } catch (e) {
            console.error(e);
            toast({
                variant: 'destructive',
                title: `Falló el Análisis para ${file.fileName}`,
                description: e instanceof Error ? e.message : 'Error inesperado.',
            });
        }
    }
    
    setUnanalysedUuids(newUuids);
    
    toast({
        title: '¡Análisis Completo!',
        description: `Se agregaron ${files.length} flujo(s) nuevos.`,
    });

    setIsLoading(false);
    setAnalysisProgress({ total: 0, current: 0, title: '' });
  };


  const handleClearWorkflows = () => {
    setWorkflows(initialWorkflows);
    setUnanalysedUuids(new Set());
    setHasUnsavedChanges(false);
    toast({
      title: 'Flujos de trabajo restablecidos',
      description: 'La lista ha vuelto a su estado inicial.',
    });
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    const result = await saveWorkflowsToFile(workflows);
    setIsLoading(false);
    if (result.success) {
      setHasUnsavedChanges(false);
      setUnanalysedUuids(new Set());
      setInitialWorkflows(workflows);
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
  
  const handleRunSimilarityAnalysis = async () => {
    const workflowsToAnalyze = workflows.filter(wf => unanalysedUuids.has(wf.workflow_uuid));
    if (workflowsToAnalyze.length === 0) {
      toast({
        title: 'No hay flujos nuevos para analizar',
        description: 'Sube nuevos flujos o restablece para volver a analizar.',
      });
      return;
    }

    setIsLoading(true);
    const existingWorkflows = workflows.filter(wf => !unanalysedUuids.has(wf.workflow_uuid));
    const batches = [];
    for (let i = 0; i < workflowsToAnalyze.length; i += BATCH_SIZE) {
        batches.push(workflowsToAnalyze.slice(i, i + BATCH_SIZE));
    }

    let currentWorkflowsState = [...workflows];

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        setAnalysisProgress({ 
            total: batches.length, 
            current: i + 1, 
            title: `Analizando similitudes (lote ${i + 1} de ${batches.length})...`
        });

        try {
            const updatedWorkflows = await runBatchedSimilarityAnalysis(batch, currentWorkflowsState);
            
            // Create a map for efficient updates
            const updatedWorkflowsMap = new Map(updatedWorkflows.map(wf => [wf.workflow_uuid, wf]));

            // Update the state with the new similarity info
            currentWorkflowsState = currentWorkflowsState.map(wf => {
                if (updatedWorkflowsMap.has(wf.workflow_uuid)) {
                    return updatedWorkflowsMap.get(wf.workflow_uuid)!;
                }
                return wf;
            });

            setWorkflows(currentWorkflowsState);

        } catch (error) {
            console.error('Failed to run similarity analysis for batch', error);
            toast({
                variant: 'destructive',
                title: `Error en Lote ${i + 1}`,
                description: 'No se pudo completar el análisis de similitud para este lote.',
            });
            // Stop on error
            setIsLoading(false);
            setAnalysisProgress({ total: 0, current: 0, title: '' });
            return;
        }
    }
    
    setHasUnsavedChanges(true);
    setUnanalysedUuids(new Set()); // Clear the set of unanalysed workflows
    setIsLoading(false);
    setAnalysisProgress({ total: 0, current: 0, title: '' });

    toast({
        title: 'Análisis de Similitud Completo',
        description: `Se analizaron ${workflowsToAnalyze.length} flujos nuevos.`,
    });
  };

  const handleSendToForm = async () => {
    setIsLoading(true);
    toast({
      title: 'Enviando datos a Supabase...',
      description: 'Enviando flujos de trabajo a la base de datos.',
    });
    try {
      const result = await sendToSupabase(workflows);
      if (result.success) {
        toast({
          title: '¡Éxito!',
          description: 'Los datos de los flujos de trabajo han sido enviados correctamente a Supabase.',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to send to Supabase:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Enviar a Supabase',
        description: error instanceof Error ? error.message : 'No se pudieron enviar los datos.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWorkflows = useMemo(() => {
    if (!searchQuery) return workflows;

    const query = searchQuery.toLowerCase();
    return workflows.filter(wf => 
      (wf.id && `#${wf.id}`.includes(query)) ||
      wf.flowName.toLowerCase().includes(query) ||
      wf.shortDescription.toLowerCase().includes(query) ||
      wf.mainArea.toLowerCase().includes(query) ||
      wf.mainFunction.toLowerCase().includes(query) ||
      wf.dataOrigins.some(o => o.toLowerCase().includes(query)) ||
      wf.automationDestinations.some(d => d.toLowerCase().includes(query)) ||
      wf.keyNodes.some(n => n.toLowerCase().includes(query))
    );
  }, [workflows, searchQuery]);

  const isAnalyzing = analysisProgress.total > 0;
  const similarityButtonDisabled = unanalysedUuids.size === 0 || isLoading;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        onClear={handleClearWorkflows}
        hasWorkflows={workflows.length > 0}
        onSave={handleSaveChanges}
        hasUnsavedChanges={hasUnsavedChanges}
        onRunSimilarityAnalysis={handleRunSimilarityAnalysis}
        similarityAnalysisDisabled={similarityButtonDisabled}
        onSendToForm={handleSendToForm}
        isLoading={isLoading}
        totalWorkflows={workflows.length}
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

          {isAnalyzing && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Loader2 className="h-5 w-5 animate-spin"/>
                  <p className="font-medium">
                    {analysisProgress.title}
                  </p>
                </div>
                <Progress value={(analysisProgress.current / analysisProgress.total) * 100} />
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

          {isLoading && workflows.length === 0 && !isAnalyzing ? (
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
              unanalysedUuids={unanalysedUuids}
              setHasUnsavedChanges={setHasUnsavedChanges}
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
