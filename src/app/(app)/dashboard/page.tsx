'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockScanHistory, mockWeather } from '@/lib/mock-data';
import Image from 'next/image';
import { Sun, Cloud, CloudRain, Snowflake, Wind, CloudSun, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/lib/location';

function WeatherCard() {
  const { location, loading, error, fetchLocation } = useLocation();

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
                 <AlertTriangle className="w-8 h-8 text-destructive" />
                 <p className="text-destructive max-w-sm">{error}</p>
                 <Button onClick={fetchLocation}>Try Again</Button>
            </div>
        )}
        {!loading && !error && location && (
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
