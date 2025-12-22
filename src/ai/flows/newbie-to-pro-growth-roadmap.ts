'use server';

/**
 * @fileOverview Generates a personalized growth roadmap for new farmers based on their location and crop type.
 *
 * - generateGrowthRoadmap - A function that handles the generation of the growth roadmap.
 * - GrowthRoadmapInput - The input type for the generateGrowthRoadmap function.
 * - GrowthRoadmapOutput - The return type for the generateGrowthRoadmap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GrowthRoadmapInputSchema = z.object({
  location: z
    .string()
    .describe('The geographical location of the farm (e.g., city, state).'),
  cropType: z.string().describe('The type of crop being grown (e.g., wheat, corn, soybeans).'),
});
export type GrowthRoadmapInput = z.infer<typeof GrowthRoadmapInputSchema>;

const GrowthRoadmapOutputSchema = z.object({
  roadmap: z.string().describe('A detailed growth roadmap tailored to the specific location and crop type.'),
});
export type GrowthRoadmapOutput = z.infer<typeof GrowthRoadmapOutputSchema>;

export async function generateGrowthRoadmap(input: GrowthRoadmapInput): Promise<GrowthRoadmapOutput> {
  return generateGrowthRoadmapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'growthRoadmapPrompt',
  input: {schema: GrowthRoadmapInputSchema},
  output: {schema: GrowthRoadmapOutputSchema},
  prompt: `You are an expert agricultural advisor. A new farmer is seeking guidance on growing {{cropType}} in {{location}}.

  Based on the location and crop type, generate a detailed growth roadmap that includes key stages, best practices, and potential challenges.
  Include information about:
  - Optimal planting times.
  - Soil preparation techniques.
  - Irrigation strategies.
  - Pest and disease management.
  - Harvesting guidelines.

  The roadmap should be easy to understand and actionable for a beginner.
  `,
});

const generateGrowthRoadmapFlow = ai.defineFlow(
  {
    name: 'generateGrowthRoadmapFlow',
    inputSchema: GrowthRoadmapInputSchema,
    outputSchema: GrowthRoadmapOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
