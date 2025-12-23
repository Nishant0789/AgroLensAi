'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockScanHistory, mockWeather } from '@/lib/mock-data';
import Image from 'next/image';
import { Sun, Cloud, CloudRain, Snowflake, Wind, CloudSun, MapPin, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const weatherIconMap = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  wind: Wind,
  'cloud-sun': CloudSun,
};

function WeatherCard() {
  const [location, setLocation] = useState<{ city: string; country: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCity = async (latitude: number, longitude: number) => {
    try {
      // Using a free reverse geocoding API. In a real app, you'd use a more robust service.
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
      if (!response.ok) {
        throw new Error('Failed to fetch location data.');
      }
      const data = await response.json();
      if (data.city && data.countryName) {
        setLocation({ city: data.city, country: data.countryName });
      } else {
        throw new Error('Could not determine city from coordinates.');
      }
    } catch (err: any) {
       setError('Could not fetch location name. Please try again.');
       console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    setLoading(true);
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchCity(latitude, longitude);
        },
        (err) => {
          setError('Location access denied. Please enable it in your browser settings.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    handleGetLocation();
  }, []);

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>7-Day Forecast</CardTitle>
        {location && !loading && (
            <div className="flex items-center text-sm text-muted-foreground gap-1">
                <MapPin className="h-4 w-4" />
                <span>{location.city}, {location.country}</span>
            </div>
        )}
      </CardHeader>
      <CardContent>
      {loading && (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Fetching your local forecast...</p>
          </div>
        )}
        {error && !loading && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
                 <p className="text-destructive">{error}</p>
                 <Button onClick={handleGetLocation}>Try Again</Button>
            </div>
        )}
        {!loading && !error && (
            <div className="flex justify-between overflow-x-auto gap-4">
            {mockWeather.map((day, index) => {
                const Icon = weatherIconMap[day.icon];
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
      </CardContent>
    </Card>
  );
}

function FieldJournal() {
  return (
    <Card className="glass-card mt-6">
      <CardHeader>
        <CardTitle>Field Journal (Scan History)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockScanHistory.map((scan) => (
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
                    data-ai-hint={scan.imageHint}
                  />
                </TableCell>
                <TableCell>{scan.date}</TableCell>
                <TableCell>
                  <Badge variant={scan.disease === 'Healthy' ? 'secondary' : 'destructive'}>
                    {scan.disease}
                  </Badge>
                </TableCell>
                <TableCell>{scan.confidence}%</TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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
