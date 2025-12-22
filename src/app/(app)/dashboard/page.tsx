'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { mockScanHistory, mockWeather } from '@/lib/mock-data';
import Image from 'next/image';
import { Sun, Cloud, CloudRain, Snowflake, Wind, CloudSun } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const weatherIconMap = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  wind: Wind,
  'cloud-sun': CloudSun,
};

function WeatherCard() {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>7-Day Forecast</CardTitle>
      </CardHeader>
      <CardContent>
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
  const { user } = useAuth();
  const FADE_IN = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      <motion.h1
        className="text-3xl font-bold font-headline"
        variants={FADE_IN}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5 }}
      >
        Welcome back, {user?.displayName?.split(' ')[0] || 'Farmer'}!
      </motion.h1>

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
