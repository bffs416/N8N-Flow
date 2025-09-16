'use server';
/**
 * @fileOverview Extracts key information (use cases, key nodes, descriptions) from n8n workflow templates using AI.
 *
 * - extractKeyWorkflowInfo - A function that extracts key information from n8n workflow templates.
 * - ExtractKeyWorkflowInfoInput - The input type for the extractKeyWorkflowInfo function.
 * - ExtractKeyWorkflowInfoOutput - The return type for the extractKeyWorkflowInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractKeyWorkflowInfoInputSchema = z.object({
  workflowTemplate: z
    .string()
    .describe('The n8n workflow template in JSON or TXT format.'),
});
export type ExtractKeyWorkflowInfoInput = z.infer<
  typeof ExtractKeyWorkflowInfoInputSchema
>;

const ExtractKeyWorkflowInfoOutputSchema = z.object({
  useCases: z.string().describe('The use cases of the workflow.'),
  keyNodes: z.string().describe('The key nodes in the workflow.'),
  description: z.string().describe('The description of the workflow.'),
});
export type ExtractKeyWorkflowInfoOutput = z.infer<
  typeof ExtractKeyWorkflowInfoOutputSchema
>;

export async function extractKeyWorkflowInfo(
  input: ExtractKeyWorkflowInfoInput
): Promise<ExtractKeyWorkflowInfoOutput> {
  return extractKeyWorkflowInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractKeyWorkflowInfoPrompt',
  input: {schema: ExtractKeyWorkflowInfoInputSchema},
  output: {schema: ExtractKeyWorkflowInfoOutputSchema},
  prompt: `You are an AI expert in analyzing n8n workflow templates. Your task is to extract key information from the given workflow template, including use cases, key nodes, and a concise description.

Workflow Template:
{{{workflowTemplate}}}

Provide the extracted information in a structured format.

Use Cases:
- Briefly list the primary use cases or purposes of this workflow.

Key Nodes:
- Identify and list the most important nodes within the workflow, explaining their roles.

Description:
- Write a short, comprehensive description of the workflow's functionality.
`,
});

const extractKeyWorkflowInfoFlow = ai.defineFlow(
  {
    name: 'extractKeyWorkflowInfoFlow',
    inputSchema: ExtractKeyWorkflowInfoInputSchema,
    outputSchema: ExtractKeyWorkflowInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
