'use client';

import React, { useState, useMemo } from 'react';
import type { Workflow } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
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
  Download,
  Trash2,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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

const WorkflowCard = ({ workflow }: { workflow: Workflow }) => (
  <Card className="w-full overflow-hidden">
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Main Info */}
        <div className="flex-grow">
            <div className='flex items-center gap-3'>
                 {workflow.fileName.endsWith('.json') ? <FileJson className="h-6 w-6 text-accent" /> : <FileText className="h-6 w-6 text-accent" />}
                <h2 className="text-xl font-bold text-foreground">{workflow.flowName}</h2>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">{workflow.shortDescription}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{workflow.mainArea}</span>
                </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    {getComplexityBadge(workflow.complexity)}
                </div>
                {workflow.similarities.length > 0 && (
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{workflow.similarities.length} {workflow.similarities.length === 1 ? 'similar' : 'similares'}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Data Flow */}
        <div className="flex items-center gap-2 text-sm shrink-0 rounded-lg bg-muted p-2">
            <div className="flex flex-col items-center text-center">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{workflow.dataOrigins[0] || 'N/A'}</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex flex-col items-center text-center">
                 <GitMerge className="h-4 w-4 text-muted-foreground" />
                 <span className="font-semibold">n8n</span>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex flex-col items-center text-center">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{workflow.automationDestinations[0] || 'N/A'}</span>
            </div>
        </div>
      </div>
    </div>
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="details" className="border-t">
        <AccordionTrigger className="px-4 md:px-6 text-sm font-medium text-muted-foreground data-[state=open]:text-primary hover:no-underline justify-start gap-2">
          Ver más detalles
        </AccordionTrigger>
        <AccordionContent>
          <div className="p-4 md:p-6 pt-0 bg-secondary/30 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Detalles & Nodos */}
                 <div>
                    <h3 className="font-semibold flex items-center mb-3"><BookOpen className="mr-2 h-4 w-4"/>Detalles del Flujo</h3>
                    <div className='space-y-3 text-sm p-4 bg-background rounded-lg border'>
                      <div>
                        <p className="font-medium text-foreground">Función Principal:</p>
                        <p className="text-muted-foreground">{workflow.mainFunction}</p>
                      </div>
                       <div>
                        <p className="font-medium text-foreground">Nodos Clave:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {workflow.keyNodes.map(node => <Badge key={node} variant="secondary">{node}</Badge>)}
                        </div>
                      </div>
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
              </div>

              {/* Similitudes */}
              {workflow.similarities.length > 0 && (
                <div>
                    <h3 className="font-semibold flex items-center mb-3"><Users className="mr-2 h-4 w-4"/>Análisis de Similitud</h3>
                    <div className="space-y-4">
                    {workflow.similarities
                        .sort((a, b) => b.score - a.score)
                        .map(sim => (
                        <div key={sim.workflowId} className="p-3 border rounded-md bg-background">
                            <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-foreground">{sim.workflowName}</span>
                            <Badge variant="outline">{Math.round(sim.score * 100)}% Coincidencia</Badge>
                            </div>
                            <Progress value={sim.score * 100} className="h-2 mb-2" />
                            <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground/80">Razón:</span> {sim.reason}
                            </p>
                        </div>
                        ))}
                    </div>
                </div>
              )}

              {/* Raw Content */}
              <div>
                  <h3 className="font-semibold flex items-center mb-3"><Code2 className="mr-2 h-4 w-4"/>Contenido Original</h3>
                   <div className="relative">
                     <pre className="bg-gray-900 text-white p-4 rounded-md text-xs max-h-60 overflow-auto">
                        <code>{workflow.content}</code>
                    </pre>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-gray-300 hover:bg-gray-700" onClick={() => navigator.clipboard.writeText(workflow.content)}>
                        <Copy className="h-4 w-4" />
                    </Button>
                   </div>
              </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </Card>
);


export function WorkflowList({
  workflows,
  isLoading,
}: {
  workflows: Workflow[];
  isLoading: boolean;
}) {
  
  const sortedWorkflows = useMemo(() => {
    return [...workflows].sort((a, b) => a.flowName.localeCompare(b.flowName));
  }, [workflows]);

  if (isLoading && workflows.length === 0) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>Flujos de Trabajo Analizados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
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

  return (
    <div className='space-y-4'>
       <Card>
          <CardHeader>
            <CardTitle>Flujos de Trabajo Analizados ({workflows.length})</CardTitle>
          </CardHeader>
        </Card>
        {sortedWorkflows.map(workflow => (
             <WorkflowCard key={workflow.id} workflow={workflow} />
        ))}
    </div>
  );
}

// Helper icon - you might want to move this to your icons file
const Upload = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);
