'use server';
/**
 * @fileOverview Generates realistic use case examples for an n8n workflow.
 *
 * - generateUseCaseExamples - A function that generates use case examples.
 * - GenerateUseCaseExamplesInput - The input type for the generateUseCaseExamples function.
 * - GenerateUseCaseExamplesOutput - The return type for the generateUseCaseExamples function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateUseCaseExamplesInputSchema = z.object({
  workflowDescription: z.string().describe('A description or the full JSON of the n8n workflow.'),
});
export type GenerateUseCaseExamplesInput = z.infer<typeof GenerateUseCaseExamplesInputSchema>;

const GenerateUseCaseExamplesOutputSchema = z.object({
  useCaseExamples: z.array(z.string()).length(5).describe('An array of five realistic use case examples for the workflow.'),
});
export type GenerateUseCaseExamplesOutput = z.infer<typeof GenerateUseCaseExamplesOutputSchema>;

export async function generateUseCaseExamples(
  input: GenerateUseCaseExamplesInput
): Promise<GenerateUseCaseExamplesOutput> {
  return generateUseCaseExamplesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateUseCaseExamplesPrompt',
  input: {schema: GenerateUseCaseExamplesInputSchema},
  output: {schema: GenerateUseCaseExamplesOutputSchema},
  prompt: `Basado en la siguiente descripción o JSON de un flujo de trabajo de n8n, genera cinco ejemplos de casos de uso realistas donde este flujo podría ser aplicado. Responde únicamente en español.

Flujo de trabajo:
{{{workflowDescription}}}

Proporciona la respuesta como un arreglo de 5 strings.
`,
});

const generateUseCaseExamplesFlow = ai.defineFlow(
  {
    name: 'generateUseCaseExamplesFlow',
    inputSchema: GenerateUseCaseExamplesInputSchema,
    outputSchema: GenerateUseCaseExamplesOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
