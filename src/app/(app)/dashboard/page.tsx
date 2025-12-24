'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Sun, Cloud, CloudRain, Snowflake, Wind, CloudSun, MapPin, Loader2, AlertTriangle, Edit, Check, Leaf, Plus, Tractor, Calendar, Droplet, SunSnow, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/lib/location';
import { useEffect, useState, useMemo } from 'react';
import { getWeatherForecast } from '@/ai/flows/get-weather-forecast';
import { type WeatherDataPoint } from '@/ai/flows/weather-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth.tsx';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { CardSpotlight } from '@/components/ui/card-spotlight';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { generateTaskTimeline } from '@/ai/flows/task-generator';
import { format, parseISO } from 'date-fns';

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

// ====== New Components for Field & Task Management ======

type Field = {
    id: string;
    name: string;
    crop: string;
    createdAt: { seconds: number };
}

type NewFieldInputs = {
    name: string;
    crop: string;
};

function AddFieldModal() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NewFieldInputs>();
    const [isOpen, setIsOpen] = useState(false);

    const onSubmit: SubmitHandler<NewFieldInputs> = async (data) => {
        if (!user) return;
        const fieldsCollection = collection(firestore, `users/${user.uid}/fields`);
        await addDoc(fieldsCollection, {
            ...data,
            userId: user.uid,
            createdAt: serverTimestamp(),
        });
        reset();
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2" /> Add New Field
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add a New Field</DialogTitle>
                    <DialogDescription>Enter the details for your new field to start tracking it.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="field-name" className="text-right">Field Name</Label>
                            <Input id="field-name" {...register("name", { required: "Field name is required" })} className="col-span-3" placeholder="e.g., North Field"/>
                            {errors.name && <p className="col-span-4 text-right text-sm text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="crop-name" className="text-right">Crop</Label>
                            <Input id="crop-name" {...register("crop", { required: "Crop name is required" })} className="col-span-3" placeholder="e.g., Wheat"/>
                            {errors.crop && <p className="col-span-4 text-right text-sm text-destructive">{errors.crop.message}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="animate-spin mr-2"/>}
                            Add Field
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function MyFields() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const fieldsQuery = user ? query(collection(firestore, `users/${user.uid}/fields`), orderBy('createdAt', 'desc')) : null;
    const { data: fields, loading } = useCollection<Field>(fieldsQuery);

    return (
        <CardSpotlight className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>My Fields</CardTitle>
                    <CardDescription>Manage your fields and the crops you're growing.</CardDescription>
                </div>
                <AddFieldModal />
            </CardHeader>
            <CardContent>
                {loading && <div className="text-center p-8"><Loader2 className="mx-auto animate-spin" /></div>}
                {!loading && (!fields || fields.length === 0) ? (
                    <div className="text-center text-muted-foreground p-8">
                        <Tractor className="mx-auto h-12 w-12 mb-4"/>
                        <h3 className="font-semibold">No fields yet</h3>
                        <p>Add your first field to start getting personalized advice.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Field Name</TableHead>
                                <TableHead>Crop</TableHead>
                                <TableHead>Added On</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields?.map(field => (
                                <TableRow key={field.id}>
                                    <TableCell className="font-medium">{field.name}</TableCell>
                                    <TableCell><Badge variant="secondary">{field.crop}</Badge></TableCell>
                                    <TableCell>{field.createdAt ? new Date(field.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </CardSpotlight>
    )
}

type Task = {
    id: string;
    fieldId: string;
    title: string;
    description: string;
    date: string;
    category: "Watering" | "Fertilizing" | "Pest Control" | "Planting" | "Harvesting" | "Other";
    completed: boolean;
}

const categoryIcons = {
    Watering: <Droplet className="text-blue-500" />,
    Fertilizing: <Leaf className="text-green-500" />,
    "Pest Control": <Bug className="text-red-500" />,
    Planting: <Tractor className="text-yellow-500" />,
    Harvesting: <Tractor className="text-purple-500" />,
    Other: <SunSnow className="text-gray-500" />
};

function TaskTimeline() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { location } = useLocation();

    const fieldsQuery = user ? query(collection(firestore, `users/${user.uid}/fields`)) : null;
    const { data: fields, loading: fieldsLoading } = useCollection<Field>(fieldsQuery);

    const tasksQuery = user ? query(collection(firestore, `users/${user.uid}/tasks`), orderBy('date', 'asc')) : null;
    const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);
    
    const [isGenerating, setIsGenerating] = useState(false);

    const generateTasksForField = async (field: Field) => {
        if (!user || !location || isGenerating) return;
        setIsGenerating(true);

        try {
            const result = await generateTaskTimeline({
                crop: field.crop,
                location: {
                    city: location.city,
                    country: location.country,
                    latitude: location.lat,
                    longitude: location.lon,
                },
                // For simplicity, we assume planting date is the date the field was added.
                // A more robust solution would ask the user for this.
                plantingDate: format(new Date(field.createdAt.seconds * 1000), 'yyyy-MM-dd')
            });

            const tasksCollection = collection(firestore, `users/${user.uid}/tasks`);
            for (const task of result.tasks) {
                await addDoc(tasksCollection, {
                    ...task,
                    fieldId: field.id,
                    completed: false,
                });
            }

        } catch (error) {
            console.error("Failed to generate tasks:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateAllTasks = () => {
        fields?.forEach(field => generateTasksForField(field));
    }
    
    const handleToggleComplete = async (task: Task) => {
      if (!user) return;
      const taskDocRef = doc(firestore, `users/${user.uid}/tasks`, task.id);
      await updateDoc(taskDocRef, { completed: !task.completed });
    };

    const groupedTasks = useMemo(() => {
        if (!tasks) return {};
        return tasks.reduce((acc, task) => {
            const date = format(parseISO(task.date), 'EEEE, MMMM d');
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(task);
            return acc;
        }, {} as Record<string, Task[]>);
    }, [tasks]);

    const fieldMap = useMemo(() => {
        if (!fields) return {};
        return fields.reduce((acc, field) => {
            acc[field.id] = field.name;
            return acc;
        }, {} as Record<string, string>);
    }, [fields]);


    return (
        <CardSpotlight className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Task Timeline</CardTitle>
                    <CardDescription>Your AI-generated schedule for the upcoming week.</CardDescription>
                </div>
                 <Button onClick={handleGenerateAllTasks} disabled={isGenerating || fieldsLoading || !fields?.length}>
                    {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Calendar className="mr-2" />}
                    Generate Tasks
                </Button>
            </CardHeader>
            <CardContent>
                {(tasksLoading || fieldsLoading) && <div className="text-center p-8"><Loader2 className="mx-auto animate-spin" /></div>}
                
                {!tasksLoading && !tasks?.length && (
                    <div className="text-center text-muted-foreground p-8">
                        <Calendar className="mx-auto h-12 w-12 mb-4"/>
                        <h3 className="font-semibold">No tasks scheduled</h3>
                        <p>Click "Generate Tasks" to create your personalized timeline.</p>
                    </div>
                )}
                
                <div className="space-y-6">
                    {Object.entries(groupedTasks).map(([date, dateTasks]) => (
                        <div key={date}>
                            <h3 className="font-semibold mb-2 text-primary">{date}</h3>
                            <div className="space-y-2">
                                {dateTasks.map(task => (
                                    <motion.div 
                                        key={task.id}
                                        className={`flex items-start gap-3 p-3 rounded-md transition-all ${task.completed ? 'bg-secondary/50 text-muted-foreground line-through' : 'bg-secondary/20'}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleComplete(task)}>
                                          <Check className={`transition-all ${task.completed ? 'opacity-100' : 'opacity-0'}`} />
                                        </Button>
                                        <div className="flex-1">
                                            <p className="font-medium">{task.title}</p>
                                            <p className="text-sm text-muted-foreground">{task.description}</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <Badge variant="outline" className="flex items-center gap-1.5">
                                                {categoryIcons[task.category as keyof typeof categoryIcons]}
                                                {task.category}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground mt-1">{fieldMap[task.fieldId] || '...'}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </CardSpotlight>
    )
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
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <MyFields />
      </motion.div>

      <motion.div
        variants={FADE_IN}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <TaskTimeline />
      </motion.div>
    </div>
  );
}
