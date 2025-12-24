'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Sun, Cloud, CloudRain, Snowflake, Wind, CloudSun, MapPin, Loader2, AlertTriangle, Edit, Check, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/lib/location';
import { useEffect, useState } from 'react';
import { getWeatherForecast, WeatherDataPoint } from '@/ai/flows/get-weather-forecast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth.tsx';
import { useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { CardSpotlight } from '@/components/ui/card-spotlight';

const weatherIconMap: { [key: string]: React.ElementType } = {
    sun: Sun,
    cloud: Cloud,
    rain: CloudRain,
    snow: Snowflake,
    wind: Wind,
    'cloud-sun': CloudSun,
    sunny: Sun,
    'partly-cloudy': CloudSun,
    cloudy: Cloud,
    'showers': CloudRain,
};

function WeatherCard() {
  const { location, loading: locationLoading, error: locationError, fetchLocation, setLocation } = useLocation();
  const [weather, setWeather] = useState<WeatherDataPoint[] | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  const fetchWeather = async () => {
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
  };

  useEffect(() => {
    if (location) {
      fetchWeather();
    }
  }, [location]);
  
  const handleUpdateLocation = async () => {
    if (!newLocation) return;
    setIsUpdatingLocation(true);
    try {
      await setLocation(newLocation);
      setIsLocationModalOpen(false);
      setNewLocation('');
    } catch (error) {
       console.error("Failed to update location:", error);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  return (
    <>
      <CardSpotlight>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>7-Day Forecast</CardTitle>
          {location && !locationLoading && (
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <div className='flex items-center gap-1'>
                    <MapPin className="h-4 w-4" />
                    <span>{location.city}, {location.country}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsLocationModalOpen(true)}>
                      <Edit className="h-4 w-4" />
                  </Button>
              </div>
          )}
        </CardHeader>
        <CardContent>
        {locationLoading && (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Fetching your location...</p>
            </div>
          )}
          {locationError && !locationLoading && (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
                   <AlertTriangle className="w-8 h-8 text-destructive" />
                   <p className="text-destructive max-w-sm">{locationError}</p>
                   <Button onClick={fetchLocation}>Try Again</Button>
              </div>
          )}
          {!locationLoading && location && (
            <>
              {weatherLoading && (
                 <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Fetching local forecast...</p>
                  </div>
              )}
              {weatherError && !weatherLoading && (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
                       <AlertTriangle className="w-8 h-8 text-destructive" />
                       <p className="text-destructive max-w-sm">{weatherError}</p>
                       <Button onClick={fetchWeather}>Try Again</Button>
                  </div>
              )}
              {!weatherLoading && !weatherError && weather && (
                  <div className="flex justify-between overflow-x-auto gap-4">
                  {weather.map((day, index) => {
                      const Icon = weatherIconMap[day.icon.toLowerCase()] || Sun;
                      return (
                      <motion.div
                          key={day.day}
                          className="flex flex-col items-center gap-2 p-2 rounded-lg flex-shrink-0"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                      >
                          <p className="font-semibold text-sm">{day.day}</p>
                          <Icon className="w-8 h-8 text-primary" />
                          <p className="font-bold text-lg">{day.temp}°</p>
                          <p className="text-xs text-muted-foreground">{day.description}</p>
                      </motion.div>
                      );
                  })}
                  </div>
              )}
            </>
          )}
        </CardContent>
      </CardSpotlight>
      
      <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Location</DialogTitle>
            <DialogDescription>
              Enter a new city to update your weather forecast and other location-based features.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location-input" className="text-right">
                City
              </Label>
              <Input
                id="location-input"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="col-span-3"
                placeholder="e.g., San Francisco"
                disabled={isUpdatingLocation}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLocationModalOpen(false)} disabled={isUpdatingLocation}>Cancel</Button>
            <Button onClick={handleUpdateLocation} disabled={isUpdatingLocation || !newLocation}>
              {isUpdatingLocation ? <Loader2 className="animate-spin" /> : <Check />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type Scan = {
    id: string;
    imageUrl: string;
    createdAt: { seconds: number; nanoseconds: number };
    disease: string;
};

function FieldJournal() {
  const { user } = useAuth();
  const scansQuery = user 
    ? query(
        collection(user.firestore, `users/${user.uid}/scans`), 
        orderBy('createdAt', 'desc'), 
        limit(5)
      ) 
    : null;
  const { data: scans, loading } = useCollection<Scan>(scansQuery);

  const formatDate = (timestamp: { seconds: number; nanoseconds: number; }) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <CardSpotlight className="mt-6">
      <CardHeader>
        <CardTitle>Field Journal (Recent Scans)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
             <div className="flex flex-col items-center justify-center h-40 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading journal...</p>
            </div>
        )}
        {!loading && (!scans || scans.length === 0) && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
                 <Leaf className="w-8 h-8 text-muted-foreground" />
                 <p className="text-muted-foreground max-w-sm">You haven't scanned any crops yet. Use the Crop Scanner to get started!</p>
            </div>
        )}
        {!loading && scans && scans.length > 0 && (
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Diagnosis</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {scans.map((scan) => (
                <motion.tr
                    key={scan.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="hover:bg-accent/20"
                >
                    <TableCell>
                    <Image
                        src={scan.imageUrl}
                        alt="Scan of crop"
                        width={60}
                        height={40}
                        className="rounded-md object-cover"
                        data-ai-hint="crop leaf"
                    />
                    </TableCell>
                    <TableCell>{formatDate(scan.createdAt)}</TableCell>
                    <TableCell>
                    <Badge variant={scan.disease.toLowerCase() === 'healthy' ? 'secondary' : 'destructive'}>
                        {scan.disease}
                    </Badge>
                    </TableCell>
                </motion.tr>
                ))}
            </TableBody>
            </Table>
        )}
      </CardContent>
    </CardSpotlight>
  );
}

export default function DashboardPage() {
  const FADE_IN = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      <motion.div
        variants={FADE_IN}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <WeatherCard />
      </motion.div>

      <motion.div
        variants={FADE_IN}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <FieldJournal />
      </motion.div>
    </div>
  );
}
