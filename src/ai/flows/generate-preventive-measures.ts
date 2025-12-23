'use server';

/**
 * @fileOverview Generates preventive measures for a specific crop against a disease.
 * - generatePreventiveMeasures - A function that generates the measures.
 * - GeneratePreventiveMeasuresInput - Input for the function.
 * - GeneratePreventiveMeasuresOutput - Output for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePreventiveMeasuresInputSchema = z.object({
  disease: z.string().describe('The disease to prevent.'),
  crop: z.string().describe('The crop to protect.'),
  location: z.string().describe('The geographical location for context (e.g., climate).'),
});
export type GeneratePreventiveMeasuresInput = z.infer<typeof GeneratePreventiveMeasuresInputSchema>;

const GeneratePreventiveMeasuresOutputSchema = z.object({
  measures: z.string().describe('A bulleted or numbered list of personalized preventive measures.'),
});
export type GeneratePreventiveMeasuresOutput = z.infer<typeof GeneratePreventiveMeasuresOutputSchema>;


export async function generatePreventiveMeasures(input: GeneratePreventiveMeasuresInput): Promise<GeneratePreventiveMeasuresOutput> {
  return generatePreventiveMeasuresFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generatePreventiveMeasuresPrompt',
    input: { schema: GeneratePreventiveMeasuresInputSchema },
    output: { schema: GeneratePreventiveMeasuresOutputSchema },
    prompt: `You are an expert agricultural advisor. A nearby farm has reported a case of "{{disease}}".
    A farmer in the same area ({{location}}) is growing "{{crop}}" and needs personalized advice on how to protect their crop.
    
    Provide a concise, actionable list of preventive measures they should take immediately.
    Focus on practical steps suitable for a small to medium-sized farm.
    `,
    model: 'googleai/gemini-1.5-flash',
});

const generatePreventiveMeasuresFlow = ai.defineFlow(
  {
    name: 'generatePreventiveMeasuresFlow',
    inputSchema: GeneratePreventiveMeasuresInputSchema,
    outputSchema: GeneratePreventiveMeasuresOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
