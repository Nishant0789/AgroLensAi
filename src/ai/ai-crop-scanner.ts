'use server';

/**
 * @fileOverview Identifies crop diseases from an image and suggests solutions in the user's language.
 *
 * - analyzeCrop - Analyzes a crop image for diseases and suggests solutions.
 * - AnalyzeCropInput - The input type for the analyzeCrop function.
 * - AnalyzeCropOutput - The return type for the analyzeCrop function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AnalyzeCropInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of the crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
  language: z
    .string()
    .describe('The language in which the solution should be provided (e.g., "English", "Hindi").'),
});
export type AnalyzeCropInput = z.infer<typeof AnalyzeCropInputSchema>;

const AnalyzeCropOutputSchema = z.object({
  disease: z.string().describe('The identified disease of the crop. If healthy, respond "Healthy".'),
  description: z.string().describe('A general overview of the disease.'),
  symptoms: z.array(z.string()).describe('A list of key symptoms to look for.'),
  organicSolution: z.string().describe('Detailed step-by-step organic or natural solutions to manage the disease.'),
  chemicalSolution: z.string().describe('Detailed step-by-step chemical-based solutions to manage the disease.'),
  prevention: z.array(z.string()).describe('A list of actionable steps to prevent this disease in the future.'),
});
export type AnalyzeCropOutput = z.infer<typeof AnalyzeCropOutputSchema>;

export async function analyzeCrop(input: AnalyzeCropInput): Promise<AnalyzeCropOutput> {
  return analyzeCropFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCropPrompt',
  input: {schema: AnalyzeCropInputSchema},
  output: {schema: AnalyzeCropOutputSchema},
  prompt: `You are an expert agricultural pathologist. Analyze the following crop image and provide a detailed diagnosis and treatment plan in the specified language.

  Language: {{{language}}}
  Photo: {{media url=photoDataUri}}
  
  Your response must be structured and detailed. If the crop appears healthy, set the disease field to "Healthy" and briefly explain why in the description, leaving other fields empty or with positive affirmations.
  Otherwise, provide the following:
  - disease: The common name of the disease.
  - description: A brief overview of what the disease is and how it affects the crop.
  - symptoms: A bulleted list of the primary symptoms.
  - organicSolution: A detailed, step-by-step guide for an organic solution.
  - chemicalSolution: A detailed, step-by-step guide for a chemical solution, including warnings.
  - prevention: A bulleted list of long-term preventive measures.
  `,
  model: 'googleai/gemini-2.5-flash-lite',
});

const analyzeCropFlow = ai.defineFlow(
  {
    name: 'analyzeCropFlow',
    inputSchema: AnalyzeCropInputSchema,
    outputSchema: AnalyzeCropOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
