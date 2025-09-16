'use client';

import React, { useState, useMemo } from 'react';
import type { Workflow } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  FileJson,
  FileText,
  Users,
  Code2,
  BookOpen,
  Briefcase,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SortableKeys = 'flowName' | 'mainArea' | 'complexity' | 'similarities';

type SortConfig = {
  key: SortableKeys;
  direction: 'ascending' | 'descending';
} | null;

const SortableHeader = ({
  children,
  onClick,
  isSorted,
  direction,
}: {
  children: React.ReactNode;
  onClick: () => void;
  isSorted: boolean;
  direction: 'ascending' | 'descending';
}) => (
  <Button variant="ghost" onClick={onClick} className="-ml-4 h-8">
    {children}
    <ArrowUpDown
      className={cn('ml-2 h-4 w-4', isSorted ? 'text-foreground' : 'text-muted-foreground/50')}
    />
  </Button>
);

const ExpandedRowContent = ({ workflow }: { workflow: Workflow }) => (
  <div className="p-4 bg-secondary/50 space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <BookOpen className="mr-3 h-5 w-5 text-primary" />
            Detalles del Flujo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-foreground">Función Principal:</p>
            <p className="text-muted-foreground">{workflow.mainFunction}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Descripción Corta:</p>
            <p className="text-muted-foreground">{workflow.shortDescription}</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Nodos Clave:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {workflow.keyNodes.map(node => <Badge key={node} variant="secondary">{node}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Lightbulb className="mr-3 h-5 w-5 text-primary" />
            Ejemplos de Casos de Uso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            {workflow.useCaseExamples.map((example, index) => <li key={index}>{example}</li>)}
          </ul>
        </CardContent>
      </Card>
    </div>

    {workflow.similarities.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Users className="mr-3 h-5 w-5 text-primary" />
            Análisis de Similitud
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workflow.similarities
            .sort((a, b) => b.score - a.score)
            .map(sim => (
              <div key={sim.workflowId} className="p-3 border rounded-md">
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
        </CardContent>
      </Card>
    )}
  </div>
);

export function WorkflowTable({
  workflows,
  isLoading,
}: {
  workflows: Workflow[];
  isLoading: boolean;
}) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'flowName', direction: 'ascending'});

  const toggleRow = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const sortedWorkflows = useMemo(() => {
    let sortableItems = [...workflows];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key === 'similarities') {
            aValue = a.similarities.length;
            bValue = b.similarities.length;
        } else {
            aValue = a[sortConfig.key as keyof Workflow];
            bValue = b[sortConfig.key as keyof Workflow];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [workflows, sortConfig]);
  
  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getComplexityBadge = (complexity: 'Simple' | 'Medio' | 'Complejo') => {
    switch (complexity) {
      case 'Simple':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Simple</Badge>;
      case 'Medio':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Medio</Badge>;
      case 'Complejo':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Complejo</Badge>;
      default:
        return <Badge variant="secondary">{complexity}</Badge>;
    }
  };


  if (isLoading && workflows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flujos de Trabajo Analizados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flujos de Trabajo Analizados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>
                    <SortableHeader onClick={() => requestSort('flowName')} isSorted={sortConfig?.key === 'flowName'} direction={sortConfig?.direction || 'ascending'}>
                        Nombre
                    </SortableHeader>
                </TableHead>
                <TableHead>
                    <SortableHeader onClick={() => requestSort('mainArea')} isSorted={sortConfig?.key === 'mainArea'} direction={sortConfig?.direction || 'ascending'}>
                        Área Principal
                    </SortableHeader>
                </TableHead>
                <TableHead>
                    <SortableHeader onClick={() => requestSort('complexity')} isSorted={sortConfig?.key === 'complexity'} direction={sortConfig?.direction || 'ascending'}>
                        Complejidad
                    </SortableHeader>
                </TableHead>
                <TableHead className="text-right">
                    <SortableHeader onClick={() => requestSort('similarities')} isSorted={sortConfig?.key === 'similarities'} direction={sortConfig?.direction || 'ascending'}>
                        Similitud
                    </SortableHeader>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedWorkflows.map(workflow => (
                <React.Fragment key={workflow.id}>
                  <TableRow
                    onClick={() => toggleRow(workflow.id)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="px-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {expandedRows.has(workflow.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium flex items-center gap-2">
                      {workflow.fileName.endsWith('.json') ? <FileJson className="h-4 w-4 text-accent" /> : <FileText className="h-4 w-4 text-accent" />}
                      <span className="truncate">{workflow.flowName}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{workflow.mainArea}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getComplexityBadge(workflow.complexity)}</TableCell>
                    <TableCell className="text-right">
                      {workflow.similarities.length > 0 ? (
                        <Badge variant="secondary">{workflow.similarities.length} similares</Badge>
                      ) : (
                        <Badge variant="outline">Ninguna</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(workflow.id) && (
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableCell colSpan={5} className="p-0">
                        <ExpandedRowContent workflow={workflow} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
