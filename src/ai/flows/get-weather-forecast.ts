'use server';

/**
 * @fileOverview A flow to get a 7-day weather forecast for a given location.
 *
 * - getWeatherForecast - Gets the 7-day weather forecast.
 * - GetWeatherForecastInput - Input for the getWeatherForecast flow.
 * - GetWeatherForecastOutput - Output for the getWeatherForecast flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import { WeatherDataPointSchema, type WeatherDataPoint } from './weather-types';
import fetch from 'node-fetch';


const GetWeatherForecastInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});
export type GetWeatherForecastInput = z.infer<typeof GetWeatherForecastInputSchema>;

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
  75: { icon: 'Snow', 'description': 'Heavy snow fall' },
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


// This is the primary function to get weather data. It does not use AI.
export async function getWeatherForecast({ latitude, longitude }: GetWeatherForecastInput): Promise<GetWeatherForecastOutput> {
    try {
      const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max&timezone=auto`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.statusText}`);
      }
      const data: any = await response.json();

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
      console.error("Error in getWeatherForecast:", error);
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

// Data structure for the output of the geocoding service.
const GeocodeOutputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  city: z.string(),
  country: z.string(),
  name: z.string(),
});
export type GeocodeOutput = z.infer<typeof GeocodeOutputSchema>;

// Converts a city name to geographic coordinates using a public API. No AI.
export async function getCoordinatesForCity(city: string): Promise<GeocodeOutput> {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Geocoding API failed with status: ${response.status}`);
        }
        const data = await response.json();
        const result = data.results?.[0];

        if (!result) {
            throw new Error(`No results found for city: ${city}`);
        }

        return {
            latitude: result.latitude,
            longitude: result.longitude,
            city: result.name,
            country: result.country,
            name: `${result.name}, ${result.country}`,
        };

    } catch (error) {
        console.error(`Error geocoding city "${city}":`, error);
        // Throw a user-friendly error to be caught by the caller
        throw new Error(`Could not find location data for "${city}". Please try a different city name.`);
    }
}
