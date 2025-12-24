'use server';

/**
 * @fileOverview Generates a schedule of farming tasks for a specific field.
 *
 * - generateTaskTimeline - The main function that creates the task schedule.
 * - GenerateTaskTimelineInput - Input for the function.
 * - GenerateTaskTimelineOutput - Output for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getWeatherForecast } from './get-weather-forecast';
import { format } from 'date-fns';
import { WeatherDataPointSchema } from './weather-types';

const TaskSchema = z.object({
  title: z.string().describe("A short, clear title for the task (e.g., 'Water the cornfield')."),
  description: z.string().describe("A brief explanation of why this task is needed now."),
  date: z.string().describe("The date for the task in YYYY-MM-DD format."),
  category: z.enum(["Watering", "Fertilizing", "Pest Control", "Planting", "Harvesting", "Other"]).describe("The category of the task."),
});

const GenerateTaskTimelineInputSchema = z.object({
  crop: z.string().describe("The crop being grown (e.g., 'Wheat', 'Tomatoes')."),
  location: z.object({
    city: z.string(),
    country: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }).describe("The location of the field."),
  plantingDate: z.string().describe("The date the crop was planted, in YYYY-MM-DD format."),
});
export type GenerateTaskTimelineInput = z.infer<typeof GenerateTaskTimelineInputSchema>;

const GenerateTaskTimelineOutputSchema = z.object({
  tasks: z.array(TaskSchema).describe("A list of recommended farming tasks for the next 7-14 days."),
});
export type GenerateTaskTimelineOutput = z.infer<typeof GenerateTaskTimelineOutputSchema>;


export async function generateTaskTimeline(input: GenerateTaskTimelineInput): Promise<GenerateTaskTimelineOutput> {
  // 1. Get the 7-day weather forecast for the field's location.
  const weather = await getWeatherForecast({
    latitude: input.location.latitude,
    longitude: input.location.longitude,
  });

  // 2. Call the AI flow with all the necessary context.
  return taskGeneratorFlow({ ...input, weather });
}


// Internal type for the flow, which includes the weather data
const TaskGeneratorFlowInputSchema = GenerateTaskTimelineInputSchema.extend({
  weather: z.object({
    forecast: z.array(WeatherDataPointSchema),
  }).describe("The 7-day weather forecast."),
});


const prompt = ai.definePrompt({
  name: 'taskGeneratorPrompt',
  input: { schema: TaskGeneratorFlowInputSchema },
  output: { schema: GenerateTaskTimelineOutputSchema },
  prompt: `You are an expert agronomist creating a personalized task schedule for a farmer.

  **Farmer's Context:**
  - **Crop:** {{{crop}}}
  - **Location:** {{{location.city}}}, {{{location.country}}}
  - **Planting Date:** {{{plantingDate}}}
  - **Today's Date:** ${format(new Date(), 'yyyy-MM-dd')}

  **Upcoming 7-Day Weather Forecast:**
  {{#each weather.forecast}}
  - **{{day}} ({{temp}}°C):** {{description}}
  {{/each}}

  **Your Task:**
  Based on the crop type, its growth stage (calculated from the planting date), the location, and the weather forecast, generate a list of critical farming tasks for the next 7-14 days. 
  
  **Instructions:**
  - Be specific and actionable. For example, instead of "Water the crops," say "Water the crops deeply on Tuesday before the heatwave on Wednesday."
  - Prioritize tasks based on the weather. If rain is forecasted, delay watering. If it's going to be very hot, suggest adding mulch or checking for heat stress.
  - The 'date' for each task must be in YYYY-MM-DD format.
  - Create tasks for different categories like Watering, Fertilizing, and Pest Control.
  - The output must be a valid JSON object matching the provided schema.
  `,
  model: 'googleai/gemini-2.5-flash-lite',
});

const taskGeneratorFlow = ai.defineFlow(
  {
    name: 'taskGeneratorFlow',
    inputSchema: TaskGeneratorFlowInputSchema,
    outputSchema: GenerateTaskTimelineOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
