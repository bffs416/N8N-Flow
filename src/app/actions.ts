'use server';

import { extractKeyWorkflowInfo } from '@/ai/flows/extract-key-workflow-info';
import { identifySimilarWorkflows } from '@/ai/flows/identify-similar-workflows';
import type { Workflow } from '@/types';

export async function analyzeWorkflows(
  newFiles: { fileName: string; content: string }[],
  existingWorkflows: Workflow[]
): Promise<Workflow[]> {
  try {
    const newWorkflowsPromises = newFiles.map(async (file, index) => {
      // For JSON files, we can pretty-print them to potentially improve AI understanding.
      // For TXT files (which might also be JSON), we just use the content as is.
      let workflowTemplate = file.content;
      if (file.fileName.endsWith('.json')) {
        try {
          workflowTemplate = JSON.stringify(JSON.parse(file.content), null, 2);
        } catch (e) {
          // Ignore parsing errors, proceed with raw content
        }
      }

      const aiInfo = await extractKeyWorkflowInfo({ workflowTemplate });
      const workflow: Workflow = {
        id: `${file.fileName}-${Date.now()}-${index}`,
        fileName: file.fileName,
        content: file.content,
        useCases: aiInfo.useCases || 'N/A',
        keyNodes: aiInfo.keyNodes || 'N/A',
        description: aiInfo.description || 'N/A',
        similarities: [],
      };
      return workflow;
    });

    const newlyAnalyzedWorkflows = await Promise.all(newWorkflowsPromises);

    const allWorkflows = [...existingWorkflows, ...newlyAnalyzedWorkflows];
    
    // Create a map for quick lookups
    const workflowMap = new Map<string, Workflow>(allWorkflows.map(wf => [wf.id, wf]));

    if (allWorkflows.length > 1) {
      const allWorkflowContents = allWorkflows.map(wf => wf.content);
      const similarityResults = await identifySimilarWorkflows({ workflowJsons: allWorkflowContents });

      if (similarityResults) {
        similarityResults.forEach(result => {
          const wf1 = allWorkflows[result.workflow1Index];
          const wf2 = allWorkflows[result.workflow2Index];
          
          if (wf1 && wf2 && wf1.id !== wf2.id) {
            const wf1FromMap = workflowMap.get(wf1.id)!;
            const wf2FromMap = workflowMap.get(wf2.id)!;

            if (!wf1FromMap.similarities.some(s => s.workflowId === wf2.id)) {
              wf1FromMap.similarities.push({
                workflowId: wf2.id,
                workflowName: wf2.fileName,
                score: result.similarityScore,
                reason: result.reason,
              });
            }
            if (!wf2FromMap.similarities.some(s => s.workflowId === wf1.id)) {
              wf2FromMap.similarities.push({
                workflowId: wf1.id,
                workflowName: wf1.fileName,
                score: result.similarityScore,
                reason: result.reason,
              });
            }
          }
        });
      }
    }
    
    return Array.from(workflowMap.values());
  } catch (error) {
    console.error("Error in analyzeWorkflows:", error);
    throw new Error("Failed to analyze workflows due to a server error.");
  }
}
