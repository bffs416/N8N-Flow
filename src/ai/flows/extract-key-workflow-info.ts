'use server';
/**
 * @fileOverview Extracts key information from n8n workflow templates using AI.
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
  flowName: z.string().describe('El nombre del flujo, extraído directamente de la plantilla.'),
  mainArea: z.string().describe('El área de negocio principal a la que se dirige el flujo (ej: "Marketing", "Ventas", "Recursos Humanos").'),
  secondaryAreas: z.array(z.string()).describe('Otras áreas secundarias donde el flujo también podría ser útil.'),
  mainFunction: z.string().describe('Una descripción de la función principal que realiza el flujo (ej: "Sincronizar contactos entre Hubspot y Mailchimp").'),
  automationDestinations: z.array(z.string()).describe('Las aplicaciones o servicios finales a los que el flujo envía datos o realiza acciones (ej: "Slack, Google Sheets").'),
  dataOrigins: z.array(z.string()).describe('La aplicación o servicio que actúa como la principal fuente de datos o el disparador del flujo (ej: "Webhook, Stripe").'),
  keyNodes: z.array(z.string()).describe('Los nodos más importantes o cruciales dentro del flujo que definen su lógica principal (ej: "IF, Merge, HTTP Request").'),
  complexity: z.enum(['Simple', 'Medio', 'Complejo']).describe('El nivel de complejidad del flujo.'),
  shortDescription: z.string().describe('Una descripción muy breve y fácil de entender sobre lo que hace el flujo.'),
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
  prompt: `Eres un experto analista de flujos de trabajo de n8n. Tu tarea es extraer información clave de la plantilla de flujo de trabajo proporcionada y responder únicamente en español.

Plantilla de Flujo de Trabajo:
{{{workflowTemplate}}}

Extrae la siguiente información de la plantilla:
- flowName: El nombre del flujo, extraído directamente de la plantilla.
- mainArea: El área de negocio principal a la que se dirige el flujo (ej: "Marketing", "Ventas", "Recursos Humanos").
- secondaryAreas: Otras áreas secundarias donde el flujo también podría ser útil.
- mainFunction: Una descripción de la función principal que realiza el flujo (ej: "Sincronizar contactos entre Hubspot y Mailchimp").
- automationDestinations: Las aplicaciones o servicios finales a los que el flujo envía datos o realiza acciones (ej: "Slack, Google Sheets").
- dataOrigins: La aplicación o servicio que actúa como la principal fuente de datos o el disparador del flujo (ej: "Webhook, Stripe").
- keyNodes: Los nodos más importantes o cruciales dentro del flujo que definen su lógica principal (ej: "IF, Merge, HTTP Request").
- complexity: El nivel de complejidad del flujo, clasificado como "Simple", "Medio" o "Complejo".
- shortDescription: Una descripción muy breve y fácil de entender sobre lo que hace el flujo.

Proporciona la información extraída en un formato JSON estructurado.
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
