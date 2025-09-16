
'use server';

/**
 * @fileOverview Identifies similar n8n workflows based on their functionality or structure.
 *
 * - identifySimilarWorkflows - A function that identifies similar workflows.
 * - IdentifySimilarWorkflowsInput - The input type for the identifySimilarWorkflows function.
 * - IdentifySimilarWorkflowsOutput - The return type for the identifySimilarWorkflows function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WorkflowDescriptionSchema = z.object({
  uuid: z.string().describe('The unique UUID of the workflow.'),
  description: z.string().describe('The textual description of the workflow.'),
});

const IdentifySimilarWorkflowsInputSchema = z.object({
  targetWorkflows: z.array(WorkflowDescriptionSchema)
    .describe('The primary workflows to be analyzed.'),
  comparisonWorkflows: z.array(WorkflowDescriptionSchema)
    .describe('The list of workflows to compare against. The target workflows should also be compared among themselves.'),
});
export type IdentifySimilarWorkflowsInput = z.infer<typeof IdentifySimilarWorkflowsInputSchema>;

const IdentifySimilarWorkflowsOutputSchema = z.array(
  z.object({
    workflow1Uuid: z.string().describe('UUID of the first workflow.'),
    workflow2Uuid: z.string().describe('UUID of the second workflow.'),
    similarityScore: z.number().describe('A score (0-1) indicating the similarity between the two workflows.'),
    reason: z.string().describe('Explanation in Spanish of why the two workflows are similar.'),
  })
).describe('An array of similarity assessments between pairs of workflows.');
export type IdentifySimilarWorkflowsOutput = z.infer<typeof IdentifySimilarWorkflowsOutputSchema>;

export async function identifySimilarWorkflows(input: IdentifySimilarWorkflowsInput): Promise<IdentifySimilarWorkflowsOutput> {
  return identifySimilarWorkflowsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifySimilarWorkflowsPrompt',
  input: {schema: IdentifySimilarWorkflowsInputSchema},
  output: {schema: IdentifySimilarWorkflowsOutputSchema},
  prompt: `You are an expert workflow analyst, skilled at identifying similarities between n8n workflows.

Your task is to analyze the 'targetWorkflows' and find similarities by comparing them against all workflows in 'comparisonWorkflows', and also by comparing the 'targetWorkflows' against each other.

- For each workflow in 'targetWorkflows', compare it with every workflow in 'comparisonWorkflows'.
- Also, compare every pair of workflows within 'targetWorkflows'.
- Do not compare a workflow with itself.
- Only return pairs with a similarityScore greater than 0.5.
- Provide a brief explanation in Spanish for each similarity.

Target Workflows to Analyze:
{{#each targetWorkflows}}
- UUID: {{{uuid}}}, Description: {{{description}}}
{{/each}}

Workflows to Compare Against:
{{#each comparisonWorkflows}}
- UUID: {{{uuid}}}, Description: {{{description}}}
{{/each}}
  `,
});

const identifySimilarWorkflowsFlow = ai.defineFlow(
  {
    name: 'identifySimilarWorkflowsFlow',
    inputSchema: IdentifySimilarWorkflowsInputSchema,
    outputSchema: IdentifySimilarWorkflowsOutputSchema,
  },
  async input => {
    // If there's nothing to compare, or only one workflow in total, return empty.
    if (input.targetWorkflows.length === 0 || (input.targetWorkflows.length === 1 && input.comparisonWorkflows.length === 0)) {
        return [];
    }

    const {output} = await prompt(input);
    return output!;
  }
);
