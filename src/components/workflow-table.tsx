'use client';

import React, { useState, useMemo } from 'react';
import type { Workflow, Similarity } from '@/types';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SortConfig = {
  key: keyof Workflow | 'similarities';
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BookOpen className="mr-3 h-5 w-5 text-primary" />
          Full Description
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{workflow.description}</p>
      </CardContent>
    </Card>

    {workflow.similarities.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Users className="mr-3 h-5 w-5 text-primary" />
            Similarity Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workflow.similarities
            .sort((a, b) => b.score - a.score)
            .map(sim => (
              <div key={sim.workflowId} className="p-3 border rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-foreground">{sim.workflowName}</span>
                  <Badge variant="outline">{Math.round(sim.score * 100)}% Match</Badge>
                </div>
                <Progress value={sim.score * 100} className="h-2 mb-2" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground/80">Reason:</span> {sim.reason}
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
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

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
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
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
  
  const requestSort = (key: keyof Workflow | 'similarities') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyzed Workflows</CardTitle>
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
        <CardTitle>Analyzed Workflows</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>
                    <SortableHeader onClick={() => requestSort('fileName')} isSorted={sortConfig?.key === 'fileName'} direction={sortConfig?.direction || 'ascending'}>
                        File Name
                    </SortableHeader>
                </TableHead>
                <TableHead>
                    <SortableHeader onClick={() => requestSort('keyNodes')} isSorted={sortConfig?.key === 'keyNodes'} direction={sortConfig?.direction || 'ascending'}>
                        Key Nodes
                    </SortableHeader>
                </TableHead>
                <TableHead>
                    <SortableHeader onClick={() => requestSort('useCases')} isSorted={sortConfig?.key === 'useCases'} direction={sortConfig?.direction || 'ascending'}>
                        Use Cases
                    </SortableHeader>
                </TableHead>
                <TableHead className="text-right">
                    <SortableHeader onClick={() => requestSort('similarities')} isSorted={sortConfig?.key === 'similarities'} direction={sortConfig?.direction || 'ascending'}>
                        Similarity
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
                      {workflow.fileName}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      <div className="flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{workflow.keyNodes}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{workflow.useCases}</TableCell>
                    <TableCell className="text-right">
                      {workflow.similarities.length > 0 ? (
                        <Badge variant="secondary">{workflow.similarities.length} similar</Badge>
                      ) : (
                        <Badge variant="outline">None</Badge>
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
