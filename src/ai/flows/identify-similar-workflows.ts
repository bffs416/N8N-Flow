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

const IdentifySimilarWorkflowsInputSchema = z.object({
  workflowJsons: z.array(
    z.string().describe('JSON representation of n8n workflow')
  ).describe('An array of n8n workflow JSONs to compare and identify similarities.'),
});
export type IdentifySimilarWorkflowsInput = z.infer<typeof IdentifySimilarWorkflowsInputSchema>;

const IdentifySimilarWorkflowsOutputSchema = z.array(
  z.object({
    workflow1Index: z.number().describe('Index of the first workflow in the input array.'),
    workflow2Index: z.number().describe('Index of the second workflow in the input array.'),
    similarityScore: z.number().describe('A score (0-1) indicating the similarity between the two workflows.'),
    reason: z.string().describe('Explanation of why the two workflows are similar.'),
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

  Given a list of n8n workflow JSONs, analyze each pair of workflows and determine their similarity based on their functionality and structure.  Provide a similarity score between 0 and 1, and a brief explanation of why the workflows are considered similar.

  Workflows:\n{{
    #each workflowJsons
    }}Workflow {{@index}}: {{{this}}}\n{{\newline}}
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
    const {output} = await prompt(input);
    return output!;
  }
);
