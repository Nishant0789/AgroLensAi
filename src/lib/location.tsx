'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getCoordinatesForCity } from '@/ai/flows/get-weather-forecast';
import { type User, useAuth } from './auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';


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

export function LocationProvider({ children, user }: { children: ReactNode; user: User }) {
  const [location, setLocationState] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateLocationInFirestore = (loc: LocationData) => {
    if (user && user.firestore) {
      const userDocRef = doc(user.firestore, 'users', user.uid);
      setDoc(userDocRef, { 
        latitude: loc.lat,
        longitude: loc.lon,
        city: loc.city,
        country: loc.country,
        lastLocationUpdate: serverTimestamp()
      }, { merge: true });
    }
  }
  
  const setLocationData = (data: LocationData) => {
    setLocationState(data);
    setLoading(false);
    setError(null);
    updateLocationInFirestore(data);
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
        const newLocationData = {
            lat: geoData.latitude,
            lon: geoData.longitude,
            city: geoData.city,
            country: geoData.country,
            name: geoData.name,
        };
        setLocationData(newLocationData);
    } catch (err) {
        console.error("Failed to set manual location:", err);
        handleError(`Could not find location for "${city}". Please try another city.`);
    }
  }, [user]);

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
             maximumAge: 600000,
        });
    });

    const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 10000);
    });

    try {
        const winner = await Promise.race([locationPromise, timeoutPromise]);

        if (winner) {
            const position = winner;
            const { latitude, longitude } = position.coords;
            try {
              const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
              if (!geoResponse.ok) throw new Error('Failed to fetch location name.');
              const geoData = await geoResponse.json();
              
              if (geoData.city && geoData.countryName) {
                setLocationData({
                  lat: latitude,
                  lon: longitude,
                  city: geoData.city,
                  country: geoData.countryName,
                  name: `${geoData.city}, ${geoData.countryName}`,
                });
              } else {
                 throw new Error('Could not determine city from coordinates.');
              }
            } catch (err: any) {
              handleError('Could not fetch location details. Defaulting to Gorakhpur.');
              setLocationData(GORAKHPUR_LOCATION);
            }
        } else {
             handleError('Location fetch timed out. Defaulting to Gorakhpur.');
             setLocationData(GORAKHPUR_LOCATION);
        }

    } catch(err: any) {
        let errorMessage = 'An unknown error occurred. Defaulting to Gorakhpur.';
        switch(err.code) {
            case err.PERMISSION_DENIED:
                errorMessage = "Location access denied. Please enable it to use location features. Defaulting to Gorakhpur.";
                break;
            case err.POSITION_UNAVAILABLE:
                errorMessage = "Location info unavailable. Defaulting to Gorakhpur.";
                break;
            case err.TIMEOUT:
                errorMessage = "Location request timed out. Defaulting to Gorakhpur.";
                break;
        }
        handleError(errorMessage);
        setLocationData(GORAKHPUR_LOCATION);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
        fetchLocation();
    }
  }, [fetchLocation, user]);

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
