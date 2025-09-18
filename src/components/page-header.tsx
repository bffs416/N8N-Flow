
import React from 'react';
import { N8nInsightsLogo } from './icons';
import { Button } from './ui/button';
import { Link as LinkIcon, Save, Send, GitCompareArrows } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderProps {
  hasWorkflows: boolean;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  onSendToSupabase: () => void;
  onRunSimilarityAnalysis: () => void;
  isLoading: boolean;
}


export const PageHeader = ({ 
  hasWorkflows, 
  onSave, 
  hasUnsavedChanges, 
  onSendToSupabase,
  onRunSimilarityAnalysis,
  isLoading,
}: PageHeaderProps) => {
  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <N8nInsightsLogo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">n8n Insights</h1>
          </div>
         <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
                <Link href="/#analyzer">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Analizador
                </Link>
            </Button>
            {hasWorkflows && (
              <div className="flex items-center gap-2">
                 <Button
                  variant="outline"
                  size="sm"
                  onClick={onRunSimilarityAnalysis}
                  disabled={isLoading}
                >
                  <GitCompareArrows className="mr-2 h-4 w-4" />
                  Analizar Similitudes
                </Button>
                 <Button
                  variant="outline"
                  size="sm"
                  onClick={onSendToSupabase}
                  disabled={isLoading || !hasWorkflows}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Enviar a Supabase
                </Button>
                <Button variant="outline" size="sm" onClick={onSave} disabled={!hasUnsavedChanges || isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
