
'use server';

import {extractKeyWorkflowInfo} from '@/ai/flows/extract-key-workflow-info';
import {identifySimilarWorkflows} from '@/ai/flows/identify-similar-workflows';
import {generateUseCaseExamples} from '@/ai/flows/generate-use-case-examples';
import type {Workflow} from '@/types';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js'

// This is the data structure returned by the analysis, before it gets a final numeric ID
type AnalyzedWorkflowData = Omit<Workflow, 'id'>;


export async function analyzeSingleWorkflow(
  file: {fileName: string; content: string}
): Promise<AnalyzedWorkflowData> {
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


    const newWorkflowData: AnalyzedWorkflowData = {
      workflow_uuid: `${file.fileName}-${Date.now()}`,
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
      notes: '',
    };

    return newWorkflowData;
  } catch (error) {
    console.error(`Error analyzing file ${file.fileName}:`, error);
    throw new Error(`Failed to analyze ${file.fileName}.`);
  }
}

export async function runBatchedSimilarityAnalysis(
  batch: Workflow[],
  existingWorkflows: Workflow[]
): Promise<Workflow[]> {
  try {
    const fullWorkflowList: Workflow[] = [...existingWorkflows];
    const workflowMap = new Map<string, Workflow>(
      fullWorkflowList.map(wf => [wf.workflow_uuid, wf])
    );

    const toWorkflowDescription = (wf: Workflow) => ({
        uuid: wf.workflow_uuid,
        description: `
          Nombre: ${wf.flowName}
          Descripción: ${wf.shortDescription}
          Función: ${wf.mainFunction}
          Área: ${wf.mainArea}
          Orígenes: ${wf.dataOrigins.join(', ')}
          Destinos: ${wf.automationDestinations.join(', ')}
          Nodos: ${wf.keyNodes.join(', ')}
        `.trim(),
    });

    const similarityResults = await identifySimilarWorkflows({
      targetWorkflows: batch.map(toWorkflowDescription),
      comparisonWorkflows: existingWorkflows.map(toWorkflowDescription),
    });

    if (similarityResults) {
      similarityResults.forEach(result => {
        const wf1 = workflowMap.get(result.workflow1Uuid);
        const wf2 = workflowMap.get(result.workflow2Uuid);

        if (wf1 && wf2 && wf1.workflow_uuid !== wf2.workflow_uuid) {
          if (!wf1.similarities.some(s => s.workflowId === wf2.id)) {
            wf1.similarities.push({
              workflowId: wf2.id,
              workflowName: `#${wf2.id} - ${wf2.flowName}`,
              score: result.similarityScore,
              reason: result.reason,
            });
          }
          if (!wf2.similarities.some(s => s.workflowId === wf1.id)) {
            wf2.similarities.push({
              workflowId: wf1.id,
              workflowName: `#${wf1.id} - ${wf1.flowName}`,
              score: result.similarityScore,
              reason: result.reason,
            });
          }
        }
      });
    }
    
    // Return the workflows that were part of the batch or were updated
    const updatedUuids = new Set<string>();
    similarityResults.forEach(r => {
        updatedUuids.add(r.workflow1Uuid);
        updatedUuids.add(r.workflow2Uuid);
    });

    return fullWorkflowList.filter(wf => updatedUuids.has(wf.workflow_uuid));

  } catch (error) {
    console.error('Error in runBatchedSimilarityAnalysis:', error);
    throw new Error('Failed to run similarity analysis.');
  }
}


export async function saveWorkflowsToFile(workflows: Workflow[]): Promise<{success: boolean; error?: string}> {
  try {
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

export async function sendToSupabase(workflows: Workflow[]): Promise<{success: boolean; error?: string}> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Las credenciales de Supabase (URL y Anon Key) no están configuradas en el archivo .env.local.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const sanitizedWorkflows = workflows.map(({ content, id, ...wf }) => ({
        ...wf,
        secondaryAreas: wf.secondaryAreas || [],
        automationDestinations: wf.automationDestinations || [],
        dataOrigins: wf.dataOrigins || [],
        keyNodes: wf.keyNodes || [],
        useCaseExamples: wf.useCaseExamples || [],
        similarities: wf.similarities || [],
        isFavorite: wf.isFavorite || false,
        notes: wf.notes || '',
    }));

    const { data, error } = await supabase
      .from('workflows')
      .upsert(sanitizedWorkflows, { onConflict: 'workflow_uuid' });

    if (error) {
      throw error;
    }
    
    return { success: true };

  } catch (error) {
    console.error('Failed to send data to Supabase:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
