import type { Scan, Alert, WeatherData } from './types';
import { PlaceHolderImages } from './placeholder-images';

const crop1 = PlaceHolderImages.find((img) => img.id === 'crop-1');
const crop2 = PlaceHolderImages.find((img) => img.id === 'crop-2');
const crop3 = PlaceHolderImages.find((img) => img.id === 'crop-3');

export const mockScanHistory: Scan[] = [
  {
    id: '1',
    imageUrl: crop1?.imageUrl || '',
    imageHint: crop1?.imageHint || 'diseased leaf',
    date: '2024-07-20',
    disease: 'Northern Corn Leaf Blight',
    confidence: 95.4,
    solution: 'Apply a foliar fungicide. Consider crop rotation for next season.',
    location: { lat: 34.0522, lng: -118.2437 },
  },
  {
    id: '2',
    imageUrl: crop2?.imageUrl || '',
    imageHint: crop2?.imageHint || 'diseased plant',
    date: '2024-07-18',
    disease: 'Early Blight',
    confidence: 89.1,
    solution: 'Increase air circulation and use copper-based fungicides.',
    location: { lat: 40.7128, lng: -74.0060 },
  },
  {
    id: '3',
    imageUrl: crop3?.imageUrl || '',
    imageHint: crop3?.imageHint || 'wheat field',
    date: '2024-07-15',
    disease: 'Healthy',
    confidence: 99.8,
    solution: 'No action needed. Continue monitoring.',
    location: { lat: 41.8781, lng: -87.6298 },
  },
];

export const mockAlerts: Alert[] = [
  {
    id: '1',
    disease: 'Potato Late Blight',
    location: 'North Farm Field',
    distance: 2.3,
    date: '2024-07-21',
  },
  {
    id: '2',
    disease: 'Wheat Rust',
    location: 'Willow Creek',
    distance: 4.8,
    date: '2024-07-20',
  },
  {
    id: '3',
    disease: 'Corn Smut',
    location: 'East Ridge',
    distance: 1.5,
    date: '2024-07-21',
  },
];

export const mockWeather: WeatherData[] = [
  { day: 'Today', temp: 28, icon: 'sun', description: 'Sunny' },
  { day: 'Tue', temp: 26, icon: 'cloud-sun', description: 'Partly Cloudy' },
  { day: 'Wed', temp: 24, icon: 'rain', description: 'Showers' },
  { day: 'Thu', temp: 27, icon: 'cloud', description: 'Cloudy' },
  { day: 'Fri', temp: 29, icon: 'sun', description: 'Sunny' },
  { day: 'Sat', temp: 30, icon: 'sun', description: 'Sunny' },
  { day: 'Sun', temp: 28, icon: 'cloud-sun', description: 'Partly Cloudy' },
];
