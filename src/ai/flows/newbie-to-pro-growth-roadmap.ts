'use server';

/**
 * @fileOverview Generates a personalized growth roadmap for new farmers based on their location and crop type.
 * Also suggests profitable crops based on location.
 *
 * - suggestCrops - Suggests profitable crops based on location.
 * - SuggestCropsInput - Input for suggestCrops.
 * - SuggestCropsOutput - Output for suggestCrops.
 * - generateGrowthRoadmap - A function that handles the generation of the growth roadmap.
 * - GrowthRoadmapInput - The input type for the generateGrowthRoadmap function.
 * - GrowthRoadmapOutput - The return type for the generateGrowthRoadmap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schemas for Crop Suggestion Flow
const SuggestCropsInputSchema = z.object({
  location: z
    .string()
    .describe('The geographical location of the farm (e.g., city, state, or coordinates).'),
});
export type SuggestCropsInput = z.infer<typeof SuggestCropsInputSchema>;

const CropSuggestionSchema = z.object({
    name: z.string().describe("The name of the suggested crop."),
    reason: z.string().describe("A brief reason why this crop is a good choice for the location."),
    profitability: z.enum(["High", "Medium", "Low"]).describe("The predicted profitability of this crop in the region.")
});

const SuggestCropsOutputSchema = z.object({
  crops: z.array(CropSuggestionSchema).describe('A list of suggested crops.'),
});
export type SuggestCropsOutput = z.infer<typeof SuggestCropsOutputSchema>;


// Schemas for Growth Roadmap Flow
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


/**
 * Suggests profitable crops for a given location.
 */
export async function suggestCrops(input: SuggestCropsInput): Promise<SuggestCropsOutput> {
  return suggestCropsFlow(input);
}


/**
 * Generates a detailed growth roadmap for a given crop and location.
 */
export async function generateGrowthRoadmap(input: GrowthRoadmapInput): Promise<GrowthRoadmapOutput> {
  return generateGrowthRoadmapFlow(input);
}


const suggestCropsPrompt = ai.definePrompt({
    name: 'suggestCropsPrompt',
    input: { schema: SuggestCropsInputSchema },
    output: { schema: SuggestCropsOutputSchema },
    prompt: `You are an expert agricultural advisor. Based on the provided location, suggest 3-4 crops that are suitable for a new farmer to grow.
    
    Location: {{{location}}}

    For each crop, provide its name, a brief reason for its suitability (considering climate, feasibility, and demand), and a predicted profitability rating (High, Medium, or Low).
    `
});

const suggestCropsFlow = ai.defineFlow(
  {
    name: 'suggestCropsFlow',
    inputSchema: SuggestCropsInputSchema,
    outputSchema: SuggestCropsOutputSchema,
  },
  async (input) => {
    const { output } = await suggestCropsPrompt(input);
    return output!;
  }
);


const generateRoadmapPrompt = ai.definePrompt({
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
    const {output} = await generateRoadmapPrompt(input);
    return output!;
  }
);
