'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

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
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          if (!geoResponse.ok) {
            throw new Error('Failed to fetch location name.');
          }
          const geoData = await geoResponse.json();
          
          if (geoData.city && geoData.countryName) {
            const locationName = `${geoData.city}, ${geoData.countryName}`;
            setLocation({
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
          setError(err.message || 'Could not fetch location details. Please try again.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        let errorMessage = 'An unknown error occurred while accessing your location.';
        switch(err.code) {
            case err.PERMISSION_DENIED:
                errorMessage = "Location access was denied. Please enable it in your browser settings to use location-based features.";
                break;
            case err.POSITION_UNAVAILABLE:
                errorMessage = "Your location information is currently unavailable. Please check your device's location settings.";
                break;
            case err.TIMEOUT:
                errorMessage = "The request to get your location timed out. Please try again.";
                break;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000, // 10 minutes
      }
    );
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const value = { location, loading, error, fetchLocation };

  return React.createElement(LocationContext.Provider, { value: value }, children);
}

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
