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
import { format, addDays } from 'date-fns';

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


const wmoCodeToIconAndDescription: { [key: number]: { icon: string, description: string } } = {
  0: { icon: 'Sunny', description: 'Clear sky' },
  1: { icon: 'Partly-Cloudy', description: 'Mainly clear' },
  2: { icon: 'Partly-Cloudy', description: 'Partly cloudy' },
  3: { icon: 'Cloudy', description: 'Overcast' },
  45: { icon: 'Cloudy', description: 'Fog' },
  48: { icon: 'Cloudy', description: 'Depositing rime fog' },
  51: { icon: 'Rain', description: 'Light drizzle' },
  52: { icon: 'Rain', description: 'Moderate drizzle' },
  55: { icon: 'Rain', description: 'Dense drizzle' },
  56: { icon: 'Rain', description: 'Light freezing drizzle' },
  57: { icon: 'Rain', description: 'Dense freezing drizzle' },
  61: { icon: 'Rain', description: 'Slight rain' },
  63: { icon: 'Rain', description: 'Moderate rain' },
  65: { icon: 'Rain', description: 'Heavy rain' },
  66: { icon: 'Rain', description: 'Light freezing rain' },
  67: { icon: 'Rain', description: 'Heavy freezing rain' },
  71: { icon: 'Snow', description: 'Slight snow fall' },
  73: { icon: 'Snow', description: 'Moderate snow fall' },
  75: { icon: 'Snow', description: 'Heavy snow fall' },
  77: { icon: 'Snow', description: 'Snow grains' },
  80: { icon: 'Rain', description: 'Slight rain showers' },
  81: { icon: 'Rain', description: 'Moderate rain showers' },
  82: { icon: 'Rain', description: 'Violent rain showers' },
  85: { icon: 'Snow', description: 'Slight snow showers' },
  86: { icon: 'Snow', description: 'Heavy snow showers' },
  95: { icon: 'Rain', description: 'Thunderstorm' },
  96: { icon: 'Rain', description: 'Thunderstorm with slight hail' },
  99: { icon: 'Rain', description: 'Thunderstorm with heavy hail' },
};


// Tool to fetch real weather data from Open-Meteo API.
const getWeatherTool = ai.defineTool(
  {
    name: 'getWeatherTool',
    description: 'Returns a 7-day weather forecast for the given coordinates from Open-Meteo API.',
    inputSchema: GetWeatherForecastInputSchema,
    outputSchema: GetWeatherForecastOutputSchema,
  },
  async ({ latitude, longitude }) => {
    try {
      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max&timezone=auto`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.statusText}`);
      }
      const data = await response.json();

      if (!data.daily || !data.daily.time || !data.daily.temperature_2m_max) {
        throw new Error("Invalid weather data format from API.");
      }

      const forecast = data.daily.time.slice(0, 7).map((date: string, index: number) => {
        const weatherCode = data.daily.weathercode[index];
        const { icon, description } = wmoCodeToIconAndDescription[weatherCode] || { icon: 'Sunny', description: 'Clear' };
        
        let dayLabel;
        if (index === 0) {
            dayLabel = 'Today';
        } else {
            dayLabel = format(addDays(new Date(), index), 'EEE');
        }

        return {
          day: dayLabel,
          temp: Math.round(data.daily.temperature_2m_max[index]),
          icon: icon,
          description: description,
        };
      });

      return { forecast };

    } catch (error) {
      console.error("Error in getWeatherTool:", error);
      // Fallback to mock data on API failure to prevent app crash
      return { 
        forecast: [
          { day: 'Today', temp: 25, icon: 'Cloudy', description: 'API Error' },
          { day: 'Mon', temp: 25, icon: 'Cloudy', description: 'API Error' },
          { day: 'Tue', temp: 25, icon: 'Cloudy', description: 'API Error' },
          { day: 'Wed', temp: 25, icon: 'Cloudy', description: 'API Error' },
          { day: 'Thu', temp: 25, icon: 'Cloudy', description: 'API Error' },
          { day: 'Fri', temp: 25, icon: 'Cloudy', description: 'API Error' },
          { day: 'Sat', temp: 25, icon: 'Cloudy', description: 'API Error' },
        ]
      };
    }
  }
);


const prompt = ai.definePrompt({
    name: 'weatherForecastPrompt',
    system: "You are a weather assistant. Use the provided tool to get the 7-day forecast for the given location and return it to the user in the specified format.",
    tools: [getWeatherTool],
    output: { schema: GetWeatherForecastOutputSchema },
    model: 'googleai/gemini-2.5-flash',
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
    model: 'googleai/gemini-2.5-flash',
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
