'use server';

import { extractKeyWorkflowInfo } from '@/ai/flows/extract-key-workflow-info';
import { identifySimilarWorkflows } from '@/ai/flows/identify-similar-workflows';
import { generateUseCaseExamples } from '@/ai/flows/generate-use-case-examples';
import type { Workflow } from '@/types';

export async function analyzeWorkflows(
  newFiles: { fileName: string; content: string }[],
  existingWorkflows: Workflow[]
): Promise<Workflow[]> {
  try {
    const newWorkflowsPromises = newFiles.map(async (file, index) => {
      let workflowTemplate = file.content;
      if (file.fileName.endsWith('.json')) {
        try {
          workflowTemplate = JSON.stringify(JSON.parse(file.content), null, 2);
        } catch (e) {
          // Ignore parsing errors, proceed with raw content
        }
      }

      const [aiInfo, useCaseExamples] = await Promise.all([
        extractKeyWorkflowInfo({ workflowTemplate }),
        generateUseCaseExamples({ workflowDescription: workflowTemplate }) 
      ]);
      
      const workflow: Workflow = {
        id: `${file.fileName}-${Date.now()}-${index}`,
        fileName: file.fileName,
        content: file.content,
        flowName: aiInfo.flowName || 'N/A',
        mainArea: aiInfo.mainArea || 'N/A',
        secondaryAreas: aiInfo.secondaryAreas || [],
        mainFunction: aiInfo.mainFunction || 'N/A',
        automationDestinations: aiInfo.automationDestinations || [],
        dataOrigins: aiInfo.dataOrigins || [],
        keyNodes: aiInfo.keyNodes || [],
        complexity: aiInfo.complexity || 'Medio',
        shortDescription: aiInfo.shortDescription || 'N/A',
        useCaseExamples: useCaseExamples.useCaseExamples || [],
        similarities: [],
      };
      return workflow;
    });

    const newlyAnalyzedWorkflows = await Promise.all(newWorkflowsPromises);

    const allWorkflows = [...existingWorkflows, ...newlyAnalyzedWorkflows];
    
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
