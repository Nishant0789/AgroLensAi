'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLocation } from '@/lib/location';
import { getWeatherForecast } from '@/ai/flows/get-weather-forecast';
import { type WeatherDataPoint } from '@/ai/flows/weather-types';
import { generatePersonalizedGuide, type PersonalizedGuideOutput } from '@/ai/flows/newbie-to-pro-growth-roadmap';


export type CropSuggestion = PersonalizedGuideOutput['suggestions'][0];
export type GrowthRoadmap = PersonalizedGuideOutput['roadmap'];

type AIDataContextType = {
  weather: WeatherDataPoint[] | null;
  loading: boolean;
  error: string | null;
  fetchWeather: () => void;
  guideData: PersonalizedGuideOutput | null;
  fetchGuide: () => void;
  cooldown: number;
};

const AIDataContext = createContext<AIDataContextType | undefined>(undefined);

export function AIDataProvider({ children }: { children: ReactNode }) {
  const { location, loading: locationLoading } = useLocation();

  // Weather state
  const [weather, setWeather] = useState<WeatherDataPoint[] | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Guide state
  const [guideData, setGuideData] = useState<PersonalizedGuideOutput | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [guideCooldown, setGuideCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (guideCooldown > 0) {
      timer = setInterval(() => {
        setGuideCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [guideCooldown]);

  const fetchWeather = useCallback(async () => {
    if (!location) return;

    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const forecast = await getWeatherForecast({ latitude: location.lat, longitude: location.lon });
      setWeather(forecast.forecast);
    } catch (error) {
      console.error(error);
      setWeatherError('Could not fetch weather data. Please try again.');
    } finally {
      setWeatherLoading(false);
    }
  }, [location]);

  const fetchGuide = useCallback(async () => {
    if (!location?.name || guideCooldown > 0) return;

    setGuideLoading(true);
    setGuideError(null);
    setGuideCooldown(10);
    
    try {
      const result = await generatePersonalizedGuide({ location: location.name, language: 'English' });
      setGuideData(result);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || "An unknown error occurred.";
      if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('resource has been exhausted')) {
          setGuideError("The AI is currently busy or your free credits may have been used up. Please try again later.");
      } else {
          setGuideError('Could not fetch your personalized guide. The AI assistant might be busy. Please try again in a moment.');
      }
    } finally {
      setGuideLoading(false);
    }
  }, [location, guideCooldown]);

  useEffect(() => {
    if (location && !weather && !weatherLoading && !weatherError) {
      fetchWeather();
    }
    if (location && !guideData && !guideLoading && !guideError) {
      fetchGuide();
    }
  }, [location, weather, weatherLoading, weatherError, guideData, guideLoading, guideError, fetchWeather, fetchGuide]);


  const value = { 
    weather, 
    loading: weatherLoading || guideLoading || locationLoading,
    error: weatherError || guideError,
    fetchWeather,
    guideData,
    fetchGuide,
    cooldown: guideCooldown,
  };

  return React.createElement(AIDataContext.Provider, { value: value }, children);
}

export const useAIData = () => {
  const context = useContext(AIDataContext);
  if (context === undefined) {
    throw new Error('useAIData must be used within an AIDataProvider');
  }
  return context;
};
