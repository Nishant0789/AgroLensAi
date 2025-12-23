'use server';

/**
 * @fileOverview Generates a personalized growth roadmap for new farmers based on their location.
 * It suggests profitable crops and creates a detailed guide for the best one.
 *
 * - generatePersonalizedGuide - The main function that drives the flow.
 * - PersonalizedGuideInput - The input type for the function.
 * - PersonalizedGuideOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema for the main flow
const PersonalizedGuideInputSchema = z.object({
  location: z
    .string()
    .describe('The geographical location of the farm (e.g., city, state).'),
});
export type PersonalizedGuideInput = z.infer<typeof PersonalizedGuideInputSchema>;


// --- Output Schemas ---

const CropSuggestionSchema = z.object({
    name: z.string().describe("The name of the suggested crop."),
    reason: z.string().describe("A brief reason why this crop is a good choice for the location."),
    profitability: z.enum(["High", "Medium", "Low"]).describe("The predicted profitability of this crop in the region.")
});

const RoadmapStepSchema = z.object({
    title: z.string().describe("The title of this roadmap step."),
    description: z.string().describe("A detailed description of the tasks and best practices for this step."),
    duration: z.string().describe("The estimated time to complete this step (e.g., '1-2 weeks').")
});

const GrowthRoadmapSchema = z.object({
    title: z.string().describe("A summary title for the entire roadmap."),
    roadmap: z.array(RoadmapStepSchema).describe("A list of steps for the growth roadmap.")
});

// Final output schema combining suggestions and the roadmap for the top crop
const PersonalizedGuideOutputSchema = z.object({
  suggestions: z.array(CropSuggestionSchema).describe('A list of 3-4 suggested crops suitable for the location.'),
  roadmap: GrowthRoadmapSchema.describe("A detailed growth roadmap for the most profitable and feasible suggested crop.")
});
export type PersonalizedGuideOutput = z.infer<typeof PersonalizedGuideOutputSchema>;


/**
 * Generates crop suggestions and a growth roadmap for the best suggestion.
 */
export async function generatePersonalizedGuide(input: PersonalizedGuideInput): Promise<PersonalizedGuideOutput> {
  return personalizedGuideFlow(input);
}

const personalizedGuidePrompt = ai.definePrompt({
    name: 'personalizedGuidePrompt',
    input: { schema: PersonalizedGuideInputSchema },
    output: { schema: PersonalizedGuideOutputSchema },
    prompt: `You are an expert agricultural advisor. A new farmer in {{location}} needs guidance.

    Your task is two-fold:
    1.  Suggest 3-4 profitable and feasible crops for a new farmer in this location. For each crop, provide its name, a brief reason for its suitability (climate, demand), and a predicted profitability rating (High, Medium, or Low).
    2.  From the crops you just suggested, select the BEST one for a new farmer (prioritizing ease of growth and profitability). Generate a detailed, step-by-step growth roadmap for that single crop.
    
    Each step in the roadmap should have a clear title, a duration estimate, and a detailed description of the necessary actions. Key stages to include are:
    - Soil Preparation
    - Planting/Sowing
    - Germination & Early Growth
    - Vegetative Growth & Maintenance (including irrigation, fertilization)
    - Pest & Disease Management
    - Flowering & Fruiting/Graining
    - Harvesting
    - Post-Harvest Handling

    Provide the final output in the specified JSON format, containing both the list of suggestions and the detailed roadmap for the top choice.
    `,
    model: 'googleai/gemini-2.5-flash-lite',
});


const personalizedGuideFlow = ai.defineFlow(
  {
    name: 'personalizedGuideFlow',
    inputSchema: PersonalizedGuideInputSchema,
    outputSchema: PersonalizedGuideOutputSchema,
  },
  async (input) => {
    const { output } = await personalizedGuidePrompt(input);
    return output!;
  }
);
