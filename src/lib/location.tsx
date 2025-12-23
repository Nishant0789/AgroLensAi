'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getCoordinatesForCity } from '@/ai/flows/get-weather-forecast';


type LocationData = {
  lat: number;
  lon: number;
  city: string;
  country: string;
  name: string;
};

type LocationContextType = {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  fetchLocation: () => void;
  setLocation: (city: string) => Promise<void>;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const GORAKHPUR_LOCATION: LocationData = {
    lat: 26.7606,
    lon: 83.3732,
    city: "Gorakhpur",
    country: "India",
    name: "Gorakhpur, India",
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setLocationData = (data: LocationData) => {
    setLocationState(data);
    setLoading(false);
    setError(null);
  };

  const handleError = (message: string) => {
    setError(message);
    setLoading(false);
  }

  const setManualLocation = useCallback(async (city: string) => {
    setLoading(true);
    setError(null);
    try {
        const geoData = await getCoordinatesForCity(city);
        setLocationData({
            lat: geoData.latitude,
            lon: geoData.longitude,
            city: geoData.city,
            country: geoData.country,
            name: geoData.name,
        });
    } catch (err) {
        console.error("Failed to set manual location:", err);
        handleError(`Could not find location for "${city}". Please try another city.`);
        // Don't fall back to Gorakhpur here, let the user retry.
    }
  }, []);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      handleError('Geolocation is not supported. Defaulting to Gorakhpur.');
      setLocationData(GORAKHPUR_LOCATION);
      return;
    }
    
    const locationPromise = new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
             enableHighAccuracy: false,
             maximumAge: 600000, // 10 minutes
        });
    });

    const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 10000); // 10 second timeout
    });

    try {
        const winner = await Promise.race([locationPromise, timeoutPromise]);

        if (winner) { // Geolocation was successful
            const position = winner;
            const { latitude, longitude } = position.coords;
            try {
              const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
              if (!geoResponse.ok) {
                throw new Error('Failed to fetch location name.');
              }
              const geoData = await geoResponse.json();
              
              if (geoData.city && geoData.countryName) {
                const locationName = `${geoData.city}, ${geoData.countryName}`;
                setLocationData({
                  lat: latitude,
                  lon: longitude,
                  city: geoData.city,
                  country: geoData.countryName,
                  name: locationName,
                });
              } else {
                 throw new Error('Could not determine city from coordinates. Please ensure location services are accurate.');
              }
            } catch (err: any) {
              console.error("Reverse geocoding error:", err);
              handleError(err.message || 'Could not fetch location details. Defaulting to Gorakhpur.');
              setLocationData(GORAKHPUR_LOCATION);
            }
        } else { // Timeout
             handleError('Location fetch timed out. Defaulting to Gorakhpur.');
             setLocationData(GORAKHPUR_LOCATION);
        }

    } catch(err: any) { // Geolocation permission or other error
        let errorMessage = 'An unknown error occurred. Defaulting to Gorakhpur.';
        switch(err.code) {
            case err.PERMISSION_DENIED:
                errorMessage = "Location access denied. Please enable it to use location features. Defaulting to Gorakhpur.";
                break;
            case err.POSITION_UNAVAILABLE:
                errorMessage = "Location info unavailable. Defaulting to Gorakhpur.";
                break;
            case err.TIMEOUT: // This case is now handled by Promise.race, but kept for safety
                errorMessage = "Location request timed out. Defaulting to Gorakhpur.";
                break;
        }
        handleError(errorMessage);
        setLocationData(GORAKHPUR_LOCATION);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const value = { location, loading, error, fetchLocation, setLocation: setManualLocation };

  return React.createElement(LocationContext.Provider, { value: value }, children);
}

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
