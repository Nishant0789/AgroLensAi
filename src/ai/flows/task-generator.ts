'use server';

/**
 * @fileOverview Generates a schedule of farming tasks for a specific field.
 *
 * - generateTaskTimeline - The main function that creates the task schedule.
 * - GenerateTaskTimelineInput - Input for the function.
 * - GenerateTaskTimelineOutput - Output for the function.
 */

import { z } from 'zod';
import { getWeatherForecast } from './get-weather-forecast';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

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


// This function is NOT an AI flow. It's a rule-based task generator.
export async function generateTaskTimeline(input: GenerateTaskTimelineInput): Promise<GenerateTaskTimelineOutput> {
    const { crop, location, plantingDate } = input;
    const tasks: z.infer<typeof TaskSchema>[] = [];
    const today = new Date();
    
    // 1. Get the 7-day weather forecast.
    const weather = await getWeatherForecast({
        latitude: location.latitude,
        longitude: location.longitude,
    });

    const cropAgeInDays = differenceInDays(today, parseISO(plantingDate));

    // Rule 1: Basic Watering Schedule
    // Water every 3 days if no rain is forecast.
    for (let i = 0; i < 7; i++) {
        const checkDate = addDays(today, i);
        const dayWeather = weather.forecast.find(f => f.day === format(checkDate, 'EEE') || (i === 0 && f.day === 'Today'));
        
        const hasRained = weather.forecast
            .slice(Math.max(0, i-1), i+1) // check yesterday and today for rain
            .some(d => d.icon.toLowerCase().includes('rain') || d.description.toLowerCase().includes('rain'));

        if ((i % 3 === 0) && !hasRained) {
            tasks.push({
                title: `Water ${crop}`,
                description: `Check soil moisture. Water deeply if dry, especially since no rain is forecast.`,
                date: format(checkDate, 'yyyy-MM-dd'),
                category: 'Watering',
            });
        }
    }

    // Rule 2: Fertilizing based on crop age
    // Fertilize once a week for the first month.
    if (cropAgeInDays < 30 && (cropAgeInDays % 7 === 0 || tasks.length < 2)) {
         tasks.push({
            title: `Apply starter fertilizer for ${crop}`,
            description: `Apply a balanced starter fertilizer to encourage root development.`,
            date: format(addDays(today, 1), 'yyyy-MM-dd'),
            category: 'Fertilizing',
        });
    }

    // Rule 3: Pest control check
    // Check for pests every 5 days.
    if (cropAgeInDays > 14 && (cropAgeInDays % 5 === 0 || tasks.length < 3)) {
         tasks.push({
            title: `Inspect ${crop} for pests`,
            description: `Check leaves and stems for common pests. Early detection is key.`,
            date: format(addDays(today, 2), 'yyyy-MM-dd'),
            category: 'Pest Control',
        });
    }

    // Rule 4: General checkup
    tasks.push({
        title: `General field inspection`,
        description: `Walk the field to check for weeds, signs of stress, and overall crop health.`,
        date: format(addDays(today, 4), 'yyyy-MM-dd'),
        category: 'Other',
    });


    // Sort tasks by date
    tasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Remove duplicate dates, keeping the first one
    const uniqueTasks = Array.from(new Map(tasks.map(task => [task.date, task])).values());

    return { tasks: uniqueTasks.slice(0, 7) }; // Return up to 7 tasks
}
