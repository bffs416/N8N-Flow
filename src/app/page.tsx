
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
import { WorkflowFilters } from '@/components/filters';
import { ScrollToBottomButton } from '@/components/scroll-to-bottom';

const BATCH_SIZE = 5;

export default function Home() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [initialWorkflows, setInitialWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState({ total: 0, current: 0, title: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [unanalysedUuids, setUnanalysedUuids] = useState<Set<string>>(new Set());
  
  // State for new filters
  const [mainAreaFilters, setMainAreaFilters] = useState<string[]>([]);
  const [complexityFilter, setComplexityFilter] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);

  const {toast} = useToast();

  useEffect(() => {
    try {
      const workflowsWithFavoritesAndNotes = (preAnalyzedWorkflows as any[]).map((wf, index) => ({
        ...wf,
        id: wf.id || index + 1,
        workflow_uuid: wf.workflow_uuid || `pre-analyzed-${index + 1}`,
        isFavorite: wf.isFavorite || false,
        notes: wf.notes || '',
      }));
      setWorkflows(workflowsWithFavoritesAndNotes);
      setInitialWorkflows(workflowsWithFavoritesAndNotes);
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

    const newWorkflows: Workflow[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setAnalysisProgress(prev => ({ ...prev, current: i + 1 }));

        try {
            const analyzedData = await analyzeSingleWorkflow(file);
            const newId = getNextId([...workflows, ...newWorkflows]);
            const newWorkflow = { ...analyzedData, id: newId, isFavorite: false, notes: '' };
            newWorkflows.push(newWorkflow);
            newUuids.add(newWorkflow.workflow_uuid);
        } catch (e: any) {
            console.error(e);
            const newId = getNextId([...workflows, ...newWorkflows]);
            // Create a failed workflow card
            const failedWorkflow: Workflow = {
                id: newId,
                workflow_uuid: `${file.fileName}-${Date.now()}`,
                fileName: file.fileName,
                flowName: `Análisis Fallido: ${file.fileName}`,
                mainArea: "Error",
                secondaryAreas: [],
                mainFunction: e.message || 'Error inesperado.',
                automationDestinations: [],
                dataOrigins: [],
                keyNodes: [],
                complexity: 'Medio',
                shortDescription: `El análisis con IA falló. Causa: ${e.message}. Revisa la clave de API o la configuración del modelo.`,
                useCaseExamples: [],
                similarities: [],
                isFavorite: false,
                notes: '',
            };
            newWorkflows.push(failedWorkflow);
            toast({
                variant: 'destructive',
                title: `Falló el Análisis para ${file.fileName}`,
                description: e instanceof Error ? e.message : 'Error inesperado.',
            });
        }
    }
    
    setWorkflows(prev => [...prev, ...newWorkflows]);
    setUnanalysedUuids(newUuids);
    setHasUnsavedChanges(true);
    
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
    let workflowsToAnalyze = workflows.filter(wf => unanalysedUuids.has(wf.workflow_uuid));
    let existingWorkflows = workflows.filter(wf => !unanalysedUuids.has(wf.workflow_uuid));

    if (workflowsToAnalyze.length === 0) {
      // If no new workflows, assume user wants to re-analyze everything
      toast({
        title: 'Re-analizando todos los flujos',
        description: 'Se analizarán las similitudes entre todos los flujos de trabajo existentes.',
      });
      workflowsToAnalyze = workflows;
      existingWorkflows = []; // All are targets now
    }

    if (workflowsToAnalyze.length === 0 && workflows.length > 0) {
        toast({
            title: 'No hay flujos para analizar',
            description: 'Sube nuevos flujos o reinicia la aplicación.',
        });
        return;
    }


    setIsLoading(true);
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
            // In a full re-analysis, compare against the already processed part of the full list
            const comparisonList = existingWorkflows.length > 0 ? existingWorkflows : workflows.slice(0, workflows.indexOf(batch[0]));

            const updatedWorkflows = await runBatchedSimilarityAnalysis(batch, comparisonList);
            
            const updatedWorkflowsMap = new Map(updatedWorkflows.map(wf => [wf.workflow_uuid, wf]));

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
            setIsLoading(false);
            setAnalysisProgress({ total: 0, current: 0, title: '' });
            return;
        }
    }
    
    setHasUnsavedChanges(true);
    setUnanalysedUuids(new Set()); 
    setIsLoading(false);
    setAnalysisProgress({ total: 0, current: 0, title: '' });

    toast({
        title: 'Análisis de Similitud Completo',
        description: `Se analizaron ${workflowsToAnalyze.length} flujos.`,
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
    let filtered = workflows;

    // Apply favorite filter
    if (showFavorites) {
      filtered = filtered.filter(wf => wf.isFavorite);
    }

    // Apply main area filter
    if (mainAreaFilters.length > 0) {
      filtered = filtered.filter(wf => mainAreaFilters.includes(wf.mainArea));
    }

    // Apply complexity filter
    if (complexityFilter !== 'all') {
      filtered = filtered.filter(wf => wf.complexity === complexityFilter);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(wf => 
        (wf.id && `#${wf.id}`.includes(query)) ||
        wf.flowName.toLowerCase().includes(query) ||
        wf.shortDescription.toLowerCase().includes(query) ||
        wf.mainArea.toLowerCase().includes(query) ||
        wf.mainFunction.toLowerCase().includes(query) ||
        wf.dataOrigins.some(o => o.toLowerCase().includes(query)) ||
        wf.automationDestinations.some(d => d.toLowerCase().includes(query)) ||
        wf.keyNodes.some(n => n.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [workflows, searchQuery, mainAreaFilters, complexityFilter, showFavorites]);

  const isAnalyzing = analysisProgress.total > 0;
  
  const mainAreas = useMemo(() => [...Array.from(new Set(workflows.map(wf => wf.mainArea).filter(area => area !== 'Error')))], [workflows]);
  const complexities = useMemo(() => ['all', 'Simple', 'Medio', 'Complejo'], []);

  const isFiltered = searchQuery || mainAreaFilters.length > 0 || complexityFilter !== 'all' || showFavorites;

  const getTitle = () => {
    if (isFiltered) {
      if (filteredWorkflows.length === 0) {
        return 'No se encontraron resultados';
      }
      if (filteredWorkflows.length === 1) {
        return '1 flujo encontrado';
      }
      return `${filteredWorkflows.length} flujos encontrados`;
    }
    return `Flujos Analizados (${workflows.length})`;
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader
        hasWorkflows={workflows.length > 0}
        onSave={handleSaveChanges}
        hasUnsavedChanges={hasUnsavedChanges}
        onSendToForm={handleSendToForm}
        isLoading={isLoading}
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
                  <p className="font-medium text-foreground">
                    {analysisProgress.title}
                  </p>
                </div>
                <Progress value={(analysisProgress.current / analysisProgress.total) * 100} />
              </CardContent>
            </Card>
          )}

          {workflows.length > 0 && (
            <div className="sticky top-[65px] z-10 bg-background/80 backdrop-blur-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 space-y-4">
                <SearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Buscar en ${workflows.length} flujos...`}
                  disabled={isLoading}
                  onClear={() => setSearchQuery('')}
                />
                <WorkflowFilters
                    mainAreas={mainAreas}
                    complexities={complexities}
                    selectedMainAreas={mainAreaFilters}
                    setSelectedMainAreas={setMainAreaFilters}
                    complexityFilter={complexityFilter}
                    setComplexityFilter={setComplexityFilter}
                    showFavorites={showFavorites}
                    setShowFavorites={setShowFavorites}
                    disabled={isLoading}
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
              searchQuery={searchQuery}
              unanalysedUuids={unanalysedUuids}
              setHasUnsavedChanges={setHasUnsavedChanges}
              listTitle={getTitle()}
            />
          )}
        </div>
      </main>
      <footer id="footer" className="py-4 text-center text-sm text-muted-foreground">
        <p>Construido con Next.js y Genkit</p>
      </footer>
      <ScrollToBottomButton />
    </div>
  );
}

    