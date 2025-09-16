
'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { Workflow, Similarity } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  FileJson,
  FileText,
  Users,
  Briefcase,
  Lightbulb,
  Zap,
  BookOpen,
  Code2,
  GitMerge,
  ArrowRight,
  Copy,
  Trash2,
  ClipboardCopy,
} from 'lucide-react';
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
} from "@/components/ui/alert-dialog"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const getComplexityBadge = (complexity: 'Simple' | 'Medio' | 'Complejo') => {
  switch (complexity) {
    case 'Simple':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Simple</Badge>;
    case 'Medio':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">Medio</Badge>;
    case 'Complejo':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">Complejo</Badge>;
    default:
      return <Badge variant="secondary">{complexity}</Badge>;
  }
};

const InfoRow = ({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) => (
    <div className='flex items-start'>
        <div className='flex items-center w-40 shrink-0 text-muted-foreground'>
            {icon}
            <span className='font-medium'>{label}</span>
        </div>
        <div className='flex-grow'>{children}</div>
    </div>
);

const WorkflowCard = ({ workflow, onDelete }: { workflow: Workflow, onDelete: (id: string) => void }) => {
  const [openAccordion, setOpenAccordion] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const toggleAccordion = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, [role="dialog"]')) {
      return;
    }
    setOpenAccordion(openAccordion === 'details' ? '' : 'details');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setOpenAccordion('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const sortedSimilarities = workflow.similarities.length > 0 
    ? [...workflow.similarities].sort((a, b) => b.score - a.score)
    : [];

  const getSimilaritiesPreview = () => {
    if (sortedSimilarities.length === 0) return null;
    
    const topSimilarities = sortedSimilarities.slice(0, 3);
    const similarityText = topSimilarities.map(sim => sim.workflowName.split(' ')[0]).join(', ');
    const remainingCount = sortedSimilarities.length - topSimilarities.length;

    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          Similar con: <strong className="text-foreground">{similarityText}</strong>
          {remainingCount > 0 ? ` (+${remainingCount})` : ''}
        </span>
      </div>
    );
  };


  return (
  <Card ref={cardRef} className="w-full overflow-hidden flex flex-col border-primary">
     <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
      <AccordionItem value="details" className="border-none">
        <div onClick={toggleAccordion} className="cursor-pointer hover:bg-secondary/30 transition-colors">
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              {/* Main Info */}
              <div className="flex-grow">
                  <div className='flex items-start gap-3'>
                      <span className="text-xl font-bold text-primary w-8 text-center">#{workflow.displayId}</span>
                      <div className="flex-grow">
                        <div className='flex items-center gap-2'>
                          {workflow.fileName.endsWith('.json') ? <FileJson className="h-5 w-5 text-accent" /> : <FileText className="h-5 w-5 text-accent" />}
                          <h2 className="text-xl font-bold text-foreground">{workflow.flowName}</h2>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">{workflow.shortDescription}</p>
                      </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>{workflow.mainArea}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Zap className="h-4 w-4" />
                          {getComplexityBadge(workflow.complexity)}
                      </div>
                      {getSimilaritiesPreview()}
                  </div>
              </div>
            </div>
          </div>
          {/* Data Flow footer */}
          <div className="bg-muted/50 border-t px-4 py-2 text-xs">
              <div className="flex items-center justify-center gap-2">
                  <div className="flex flex-col items-center text-center">
                      <span className='text-muted-foreground'>Origen</span>
                      <span className="font-semibold">{workflow.dataOrigins[0] || 'N/A'}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-3" />
                  <div className="flex flex-col items-center text-center">
                      <span className='text-muted-foreground'>Destino</span>
                      <span className="font-semibold">{workflow.automationDestinations[0] || 'N/A'}</span>
                  </div>
              </div>
          </div>
        </div>
        <AccordionContent>
          <div className="p-4 md:p-6 pt-4 bg-secondary/30 space-y-6">
              
              {/* Detalles */}
              <div>
                <h3 className="font-semibold flex items-center mb-3"><BookOpen className="mr-2 h-4 w-4"/>Detalles del Flujo</h3>
                <div className='space-y-3 text-sm p-4 bg-background rounded-lg border'>
                  <InfoRow icon={<Briefcase className="mr-2 h-4 w-4"/>} label="Área Principal:">
                      <Badge variant="outline">{workflow.mainArea}</Badge>
                  </InfoRow>
                   {workflow.secondaryAreas.length > 0 && (
                    <InfoRow icon={<Briefcase className="mr-2 h-4 w-4"/>} label="Áreas Secundarias:">
                       <div className="flex flex-wrap gap-1">
                          {workflow.secondaryAreas.map(area => <Badge key={area} variant="outline">{area}</Badge>)}
                        </div>
                    </InfoRow>
                   )}
                  <InfoRow icon={<Zap className="mr-2 h-4 w-4"/>} label="Función Principal:">
                      <p className="text-foreground">{workflow.mainFunction}</p>
                  </InfoRow>
                  <InfoRow icon={<GitMerge className="mr-2 h-4 w-4"/>} label="Nodos Clave:">
                    <div className="flex flex-wrap gap-2">
                      {workflow.keyNodes.map(node => <Badge key={node} variant="secondary">{node}</Badge>)}
                    </div>
                  </InfoRow>
                </div>
              </div>
              
              {/* Casos de uso */}
              <div>
                <h3 className="font-semibold flex items-center mb-3"><Lightbulb className="mr-2 h-4 w-4"/>Casos de Uso</h3>
                <div className='p-4 bg-background rounded-lg border'>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      {workflow.useCaseExamples.map((example, index) => <li key={index}>{example}</li>)}
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                 {/* Botón de Similitudes */}
                 {workflow.similarities.length > 0 ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Users className="mr-2 h-4 w-4"/>
                        Ver Similitudes ({workflow.similarities.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[625px]">
                      <DialogHeader>
                        <DialogTitle>Análisis de Similitud para #{workflow.displayId} - {workflow.flowName}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-2">
                        {sortedSimilarities
                          .map(sim => (
                          <div key={sim.workflowId} className="p-3 border rounded-md bg-background">
                              <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-foreground">{sim.workflowName}</span>
                              <Badge variant="outline">{`Similitud: ${Math.round(sim.score * 100)}%`}</Badge>
                              </div>
                              <Progress value={sim.score * 100} className="h-2 mb-2" />
                              <p className="text-sm text-muted-foreground">
                              <span className="font-semibold text-foreground/80">Razón:</span> {sim.reason}
                              </p>
                          </div>
                          ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                 ) : <div />} {/* Empty div to push delete button to the right if no similarities */}

                 {/* Botón de Eliminar */}
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="destructive">
                         <Trash2 className="mr-2 h-4 w-4" />
                         Eliminar Flujo
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente el flujo de trabajo de la lista.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(workflow.id)}>Continuar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </Card>
)};


export function WorkflowList({
  workflows,
  isLoading,
  setWorkflows,
  totalWorkflows = 0,
  searchQuery = '',
}: {
  workflows: Workflow[];
  isLoading: boolean;
  setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
  totalWorkflows?: number;
  searchQuery?: string;
}) {
  const { toast } = useToast();

  const handleDeleteWorkflow = (idToDelete: string) => {
    // Also remove similarities pointing to this workflow from others
    const updatedWorkflows = workflows
      .filter(wf => wf.id !== idToDelete)
      .map(wf => ({
        ...wf,
        similarities: wf.similarities.filter(sim => sim.workflowId !== idToDelete),
      }));
    setWorkflows(updatedWorkflows);
    toast({
      title: 'Flujo de trabajo eliminado',
      description: 'El flujo de trabajo ha sido eliminado de la lista.',
    });
  };

  const handleExport = () => {
    if (workflows.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No hay flujos para exportar',
        description: 'Sube al menos un flujo de trabajo antes de exportar.',
      });
      return;
    }

    const separator = '════════════════════════════════════════════════════════════════════════════════';
    
    let formattedText = `📊 𝗥𝗘𝗦𝗨𝗠𝗘𝗡 𝗗𝗘 𝗙𝗟𝗨𝗝𝗢𝗦 𝗗𝗘 𝗧𝗥𝗔𝗕𝗔𝗝𝗢 𝗻𝟴𝗻 📊\n${separator}\n\n`;

    formattedText += workflows
      .map(wf => {
        const similaritiesText = wf.similarities.length > 0
          ? `\n\n    🤝 𝗦𝗜𝗠𝗜𝗟𝗜𝗧𝗨𝗗𝗘𝗦\n${wf.similarities.map(s => `       - Se parece a ${s.workflowName} (${Math.round(s.score * 100)}%): ${s.reason}`).join('\n')}`
          : '';

        return `//======= 𝗙𝗟𝗨𝗝𝗢 #${wf.displayId}: #️⃣ ${wf.flowName.toUpperCase()} =======//

    📌 𝗗𝗘𝗦𝗖𝗥𝗜𝗣𝗖𝗜𝗢́𝗡 𝗚𝗘𝗡𝗘𝗥𝗔𝗟
       ${wf.shortDescription}

    ⚙️ 𝗗𝗘𝗧𝗔𝗟𝗟𝗘𝗦 𝗗𝗘𝗟 𝗙𝗟𝗨𝗝𝗢
       • 𝗔́𝗿𝗲𝗮 𝗣𝗿𝗶𝗻𝗰𝗶𝗽𝗮𝗹: ${wf.mainArea}
       • 𝗙𝘂𝗻𝗰𝗶𝗼́𝗻 𝗖𝗹𝗮𝘃𝗲: ${wf.mainFunction}
       • 𝗖𝗼𝗺𝗽𝗹𝗲𝗷𝗶𝗱𝗮𝗱: ${wf.complexity}

    🔗 𝗜𝗡𝗧𝗘𝗚𝗥𝗔𝗖𝗜𝗢𝗡𝗘𝗦
       • 𝗢𝗿𝗶𝗴𝗲𝗻 𝗱𝗲 𝗗𝗮𝘁𝗼𝘀: ${wf.dataOrigins.join(', ')}
       • 𝗗𝗲𝘀𝘁𝗶𝗻𝗼𝘀: ${wf.automationDestinations.join(', ')}
       • 𝗡𝗼𝗱𝗼𝘀 𝗥𝗲𝗹𝗲𝘃𝗮𝗻𝘁𝗲𝘀: ${wf.keyNodes.join(', ')}

    💡 𝗘𝗝𝗘𝗠𝗣𝗟𝗢𝗦 𝗗𝗘 𝗖𝗔𝗦𝗢𝗦 𝗗𝗘 𝗨𝗦𝗢
${wf.useCaseExamples.map(ex => `       - ${ex}`).join('\n')}${similaritiesText}

${separator}`;
      })
      .join('\n\n\n');

    navigator.clipboard.writeText(formattedText.trim());

    toast({
      title: '¡Copiado al portapapeles!',
      description: `Se ha copiado la información de ${workflows.length} flujo(s) de trabajo.`,
    });
  };
  
  if (isLoading && totalWorkflows === 0) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>Flujos Analizados...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-6 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
                 <Skeleton className="h-4 w-full mt-3" />
                 <Skeleton className="h-4 w-2/3 mt-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getTitle = () => {
    if (searchQuery) {
      if (workflows.length === 1) return '1 resultado encontrado';
      return `${workflows.length} resultados encontrados`;
    }
    return `Flujos Analizados (${totalWorkflows})`;
  }

  return (
    <div className='space-y-4'>
       <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{getTitle()}</CardTitle>
            {workflows.length > 0 && (
               <Button variant="outline" size="sm" onClick={handleExport}>
                <ClipboardCopy className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            )}
          </CardHeader>
        </Card>
        {workflows.length === 0 && searchQuery && (
          <Card>
            <CardContent className='p-6 text-center text-muted-foreground'>
              <p>No se encontraron resultados para "<strong>{searchQuery}</strong>".</p>
            </CardContent>
          </Card>
        )}
        {workflows.map((workflow) => (
             <WorkflowCard key={workflow.id} workflow={workflow} onDelete={handleDeleteWorkflow} />
        ))}
    </div>
  );
}

    

    