
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
    };

    return newWorkflowData;
  } catch (error) {
    console.error(`Error analyzing file ${file.fileName}:`, error);
    throw new Error(`Failed to analyze ${file.fileName}.`);
  }
}

export async function runSimilarityAnalysis(
  allWorkflows: Workflow[]
): Promise<Workflow[]> {
  try {
    // Create a fresh copy to avoid mutations
    const workflows: Workflow[] = JSON.parse(JSON.stringify(allWorkflows));
    
    // Create a map for quick lookups by UUID
    const workflowMap = new Map<string, Workflow>(
      workflows.map(wf => [wf.workflow_uuid, wf])
    );
    
    // Clear old similarities
    workflows.forEach(wf => (wf.similarities = []));

    if (workflows.length > 1) {
      const workflowDescriptions = workflows.map(wf => {
        return `
          ID: ${wf.id}
          UUID: ${wf.workflow_uuid}
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
          if (result.similarityScore > 0.5) {
            const wf1 = workflows[result.workflow1Index];
            const wf2 = workflows[result.workflow2Index];

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
          }
        });
      }
    }
    
    return workflows;

  } catch (error) {
    console.error('Error in runSimilarityAnalysis:', error);
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
      throw new Error('Supabase URL or Anon Key is not configured in .env file.');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Sanitize workflows for Supabase
    const sanitizedWorkflows = workflows.map(({ content, id, ...wf }) => ({
        ...wf,
        // Supabase expects 'null' over 'undefined' for JSON fields
        secondaryAreas: wf.secondaryAreas || [],
        automationDestinations: wf.automationDestinations || [],
        dataOrigins: wf.dataOrigins || [],
        keyNodes: wf.keyNodes || [],
        useCaseExamples: wf.useCaseExamples || [],
        similarities: wf.similarities || [],
    }));

    // Upsert into the 'workflows' table.
    // It will match rows based on 'workflow_uuid' and create/update them.
    // Supabase will automatically handle the auto-incrementing 'id' primary key.
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
