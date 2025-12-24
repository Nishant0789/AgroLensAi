import { z } from 'genkit';

export const WeatherDataPointSchema = z.object({
  day: z.string().describe("The day of the week (e.g., 'Today', 'Tue')."),
  temp: z.number().describe("The temperature in Celsius."),
  icon: z.string().describe("An icon name representing the weather (e.g., 'Sunny', 'Partly-Cloudy', 'Rain')."),
  description: z.string().describe("A brief description of the weather (e.g., 'Sunny', 'Showers').")
});
export type WeatherDataPoint = z.infer<typeof WeatherDataPointSchema>;
