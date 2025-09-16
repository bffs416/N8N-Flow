'use client';

import { useState } from 'react';
import type { Workflow } from '@/types';
import { PageHeader } from '@/components/page-header';
import { FileUploader } from '@/components/file-uploader';
import { WorkflowTable } from '@/components/workflow-table';
import { analyzeWorkflows } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';

export default function Home() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFilesUpload = async (files: { fileName: string; content: string }[]) => {
    if (files.length === 0) return;
    setIsLoading(true);
    try {
      const updatedWorkflows = await analyzeWorkflows(files, workflows);
      setWorkflows(updatedWorkflows);
      toast({
        title: 'Analysis Complete',
        description: `${files.length} new workflow(s) have been analyzed and added.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'An unexpected error occurred while analyzing the workflows. Please check the console for details.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <FileUploader onFilesUploaded={handleFilesUpload} disabled={isLoading} />
          {workflows.length === 0 && !isLoading ? (
            <Card className="w-full">
              <CardContent className="py-20 flex flex-col items-center justify-center text-center">
                <UploadCloud className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground">Awaiting Workflows</h3>
                <p className="text-muted-foreground mt-2">
                  Upload your n8n workflow files to begin the analysis.
                </p>
              </CardContent>
            </Card>
          ) : (
            <WorkflowTable workflows={workflows} isLoading={isLoading} />
          )}
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>Built with Next.js and Genkit</p>
      </footer>
    </div>
  );
}
