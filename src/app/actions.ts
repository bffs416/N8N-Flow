'use server';

import {extractKeyWorkflowInfo} from '@/ai/flows/extract-key-workflow-info';
import {identifySimilarWorkflows} from '@/ai/flows/identify-similar-workflows';
import {generateUseCaseExamples} from '@/ai/flows/generate-use-case-examples';
import type {Workflow} from '@/types';
import fs from 'fs';
import path from 'path';

// Helper to find the next available index for a workflow
function getNextIndex(workflows: Workflow[]): number {
  if (workflows.length === 0) {
    return 1;
  }
  const maxIndex = Math.max(...workflows.map(wf => wf.displayId));
  return maxIndex + 1;
}

export async function analyzeSingleWorkflow(
  file: {fileName: string; content: string},
  existingWorkflows: Workflow[]
): Promise<Workflow> {
  try {
    let workflowTemplate = file.content;
    if (file.fileName.endsWith('.json')) {
      try {
        workflowTemplate = JSON.stringify(JSON.parse(file.content), null, 2);
      } catch (e) {
        // Ignore parsing errors, proceed with raw content
      }
    }

    const [aiInfo, useCaseExamples] = await Promise.all([
      extractKeyWorkflowInfo({workflowTemplate}),
      generateUseCaseExamples({workflowDescription: workflowTemplate}),
    ]);

    const nextId = getNextIndex(existingWorkflows);

    const newWorkflow: Workflow = {
      id: `${file.fileName}-${Date.now()}`,
      displayId: nextId,
      fileName: file.fileName,
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

    return newWorkflow;
  } catch (error) {
    console.error(`Error analyzing file ${file.fileName}:`, error);
    throw new Error(`Failed to analyze ${file.fileName}.`);
  }
}

export async function runSimilarityAnalysis(
  allWorkflows: Workflow[]
): Promise<Workflow[]> {
  try {
    // Create a fresh copy to avoid mutations and ensure order is preserved.
    const workflows = JSON.parse(JSON.stringify(allWorkflows)) as Workflow[];
    
    // Create a map for quick lookups by ID
    const workflowMap = new Map<string, Workflow>(
      workflows.map(wf => [wf.id, wf])
    );
    
    // Clear old similarities before re-calculating for all workflows
    workflows.forEach(wf => (wf.similarities = []));

    // Run similarity check only if there is more than one workflow
    if (workflows.length > 1) {
      
      const workflowDescriptions = workflows.map(wf => {
        return `
          Nombre del Flujo: ${wf.flowName}
          Descripción: ${wf.shortDescription}
          Función Principal: ${wf.mainFunction}
          Área Principal: ${wf.mainArea}
          Orígenes de Datos: ${wf.dataOrigins.join(', ')}
          Destinos de Automatización: ${wf.automationDestinations.join(', ')}
          Nodos Clave: ${wf.keyNodes.join(', ')}
        `.trim();
      });

      const similarityResults = await identifySimilarWorkflows({
        workflowDescriptions: workflowDescriptions,
      });

      if (similarityResults) {
        similarityResults.forEach(result => {
          // Only process pairs with a meaningful similarity score
          if (result.similarityScore > 0.5) {
            const wf1 = workflows[result.workflow1Index];
            const wf2 = workflows[result.workflow2Index];

            if (wf1 && wf2 && wf1.id !== wf2.id) {
              const wf1FromMap = workflowMap.get(wf1.id)!;
              const wf2FromMap = workflowMap.get(wf2.id)!;

              // Check for existence before adding to prevent duplicates
              if (!wf1FromMap.similarities.some(s => s.workflowId === wf2.id)) {
                wf1FromMap.similarities.push({
                  workflowId: wf2.id,
                  workflowName: `#${wf2.displayId} - ${wf2.flowName}`,
                  score: result.similarityScore,
                  reason: result.reason,
                });
              }
              if (!wf2FromMap.similarities.some(s => s.workflowId === wf1.id)) {
                wf2FromMap.similarities.push({
                  workflowId: wf1.id,
                  workflowName: `#${wf1.displayId} - ${wf1.flowName}`,
                  score: result.similarityScore,
                  reason: result.reason,
                });
              }
            }
          }
        });
      }
    }
    
    // Convert map values back to an array, preserving original order
    const finalWorkflows = workflows.map(wf => workflowMap.get(wf.id)!);
    
    return finalWorkflows;

  } catch (error) {
    console.error('Error in runSimilarityAnalysis:', error);
    throw new Error('Failed to run similarity analysis.');
  }
}

export async function saveWorkflowsToFile(workflows: Workflow[]): Promise<{success: boolean; error?: string}> {
  try {
    // Sanitize workflows to remove optional 'content' property if it exists
    const sanitizedWorkflows = workflows.map(({ content, ...wf }) => wf);
    
    const filePath = path.join(process.cwd(), 'src', 'lib', 'pre-analyzed-workflows.json');
    const fileContent = JSON.stringify(sanitizedWorkflows, null, 2);
    
    fs.writeFileSync(filePath, fileContent, 'utf-8');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to save workflows to file:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
