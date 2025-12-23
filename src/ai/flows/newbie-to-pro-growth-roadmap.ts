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

const RoadmapStepSchema = z.object({
    title: z.string().describe("The title of this roadmap step."),
    description: z.string().describe("A detailed description of the tasks and best practices for this step."),
    duration: z.string().describe("The estimated time to complete this step (e.g., '1-2 weeks').")
});

const GrowthRoadmapOutputSchema = z.object({
    title: z.string().describe("A summary title for the entire roadmap."),
    roadmap: z.array(RoadmapStepSchema).describe("A list of steps for the growth roadmap.")
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
    
    Location: {{location}}

    For each crop, provide its name, a brief reason for its suitability (considering climate, feasibility, and demand), and a predicted profitability rating (High, Medium, or Low).
    `,
    model: 'googleai/gemini-2.5-flash',
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

  Generate a detailed, step-by-step growth roadmap. Each step should have a clear title, a duration estimate, and a detailed description of the necessary actions.
  
  Key stages to include are:
  - Soil Preparation
  - Planting/Sowing
  - Germination & Early Growth
  - Vegetative Growth & Maintenance (including irrigation, fertilization)
  - Pest & Disease Management
  - Flowering & Fruiting/Graining
  - Harvesting
  - Post-Harvest Handling

  Provide the output in the specified JSON format.
  `,
  model: 'googleai/gemini-2.5-flash',
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
