'use server';

/**
 * @fileOverview A flow to get a 7-day weather forecast for a given location.
 *
 * - getWeatherForecast - Gets the 7-day weather forecast.
 * - GetWeatherForecastInput - Input for the getWeatherForecast flow.
 * - GetWeatherForecastOutput - Output for the getWeatherForecast flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetWeatherForecastInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});
export type GetWeatherForecastInput = z.infer<typeof GetWeatherForecastInputSchema>;

const WeatherDataPointSchema = z.object({
    day: z.string().describe("The day of the week (e.g., 'Today', 'Tue')."),
    temp: z.number().describe("The temperature in Celsius."),
    icon: z.string().describe("An icon name representing the weather (e.g., 'Sunny', 'Partly-Cloudy', 'Rain')."),
    description: z.string().describe("A brief description of the weather (e.g., 'Sunny', 'Showers').")
});
export type WeatherDataPoint = z.infer<typeof WeatherDataPointSchema>;

const GetWeatherForecastOutputSchema = z.object({
  forecast: z.array(WeatherDataPointSchema).describe('A 7-day weather forecast.'),
});
export type GetWeatherForecastOutput = z.infer<typeof GetWeatherForecastOutputSchema>;

// Mock tool to simulate fetching weather data. In a real app, this would call a weather API.
const getWeatherTool = ai.defineTool(
  {
    name: 'getWeatherTool',
    description: 'Returns a 7-day weather forecast for the given coordinates.',
    inputSchema: GetWeatherForecastInputSchema,
    outputSchema: GetWeatherForecastOutputSchema,
  },
  async (input) => {
    // This is mock data. A real implementation would fetch from a weather service.
    // The variety in mock data helps the model return more diverse results.
    const mockForecasts = [
        [{ day: 'Today', temp: 28, icon: 'Sunny', description: 'Clear skies' }, { day: 'Tue', temp: 26, icon: 'Partly-Cloudy', description: 'Few clouds' }, { day: 'Wed', temp: 24, icon: 'Rain', description: 'Light rain' }, { day: 'Thu', temp: 27, icon: 'Cloudy', description: 'Overcast' }, { day: 'Fri', temp: 29, icon: 'Sunny', description: 'Clear skies' }, { day: 'Sat', temp: 30, icon: 'Sunny', description: 'Very sunny' }, { day: 'Sun', temp: 28, icon: 'Partly-Cloudy', description: 'Some clouds' }],
        [{ day: 'Today', temp: 15, icon: 'Rain', description: 'Showers' }, { day: 'Tue', temp: 17, icon: 'Cloudy', description: 'Overcast' }, { day: 'Wed', temp: 18, icon: 'Partly-Cloudy', description: 'A few clouds' }, { day: 'Thu', temp: 16, icon: 'Rain', description: 'Heavy rain' }, { day: 'Fri', temp: 19, icon: 'Sunny', description: 'Sunny' }, { day: 'Sat', temp: 20, icon: 'Sunny', description: 'Clear' }, { day: 'Sun', temp: 18, icon: 'Partly-Cloudy', description: 'Broken clouds' }],
    ];
    const forecast = mockForecasts[Math.floor(Math.random() * mockForecasts.length)];
    return { forecast };
  }
);


const prompt = ai.definePrompt({
    name: 'weatherForecastPrompt',
    system: "You are a weather assistant. Use the provided tool to get the 7-day forecast for the given location and return it to the user in the specified format.",
    tools: [getWeatherTool],
    output: { schema: GetWeatherForecastOutputSchema },
});

const getWeatherForecastFlow = ai.defineFlow(
  {
    name: 'getWeatherForecastFlow',
    inputSchema: GetWeatherForecastInputSchema,
    outputSchema: GetWeatherForecastOutputSchema,
  },
  async (input) => {
    // Call the tool directly for reliability instead of relying on the prompt.
    const forecast = await getWeatherTool(input);
    return forecast;
  }
);

export async function getWeatherForecast(input: GetWeatherForecastInput): Promise<GetWeatherForecastOutput> {
  return getWeatherForecastFlow(input);
}


// Flow for converting city name to coordinates
const GeocodeInputSchema = z.object({
  city: z.string().describe('The name of the city.'),
});
export type GeocodeInput = z.infer<typeof GeocodeInputSchema>;

const GeocodeOutputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  city: z.string(),
  country: z.string(),
  name: z.string(),
});
export type GeocodeOutput = z.infer<typeof GeocodeOutputSchema>;

// In a real app, this would use a geocoding service. Here we mock it.
const geocodeTool = ai.defineTool({
  name: 'geocodeTool',
  description: 'Converts a city name to geographic coordinates.',
  inputSchema: GeocodeInputSchema,
  outputSchema: GeocodeOutputSchema,
}, async ({ city }) => {
  console.log(`Geocoding (mock) for: ${city}`);
  const cityLower = city.toLowerCase();

  // Simple mock. A real implementation would call a geocoding API.
  if (cityLower.includes('bhatni')) {
    return { latitude: 26.3833, longitude: 83.9333, city: 'Bhatni', country: 'India', name: 'Bhatni, Uttar Pradesh' };
  }
  if (cityLower.includes('delhi')) {
      return { latitude: 28.7041, longitude: 77.1025, city: 'Delhi', country: 'India', name: 'Delhi, India' };
  }
  if (cityLower.includes('mumbai')) {
      return { latitude: 19.0760, longitude: 72.8777, city: 'Mumbai', country: 'India', name: 'Mumbai, India' };
  }
  // Default to Gorakhpur if not found
  return { latitude: 26.7606, longitude: 83.3732, city: 'Gorakhpur', country: 'India', name: 'Gorakhpur, India' };
});


const geocodePrompt = ai.definePrompt({
    name: 'geocodePrompt',
    system: "Use the geocode tool to find the coordinates for the given city.",
    tools: [geocodeTool],
    output: { schema: GeocodeOutputSchema },
});


const geocodeFlow = ai.defineFlow({
    name: 'geocodeFlow',
    inputSchema: GeocodeInputSchema,
    outputSchema: GeocodeOutputSchema,
}, async(input) => {
    const { output } = await geocodePrompt({city: input.city});
    return output!;
});


export async function getCoordinatesForCity(city: string): Promise<GeocodeOutput> {
  return geocodeFlow({ city });
}
