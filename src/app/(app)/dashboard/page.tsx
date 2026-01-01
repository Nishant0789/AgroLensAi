'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Sun, Cloud, CloudRain, Snowflake, Wind, CloudSun, MapPin, Loader2, AlertTriangle, Edit, Check, Leaf, Plus, Tractor, Calendar, Droplet, SunSnow, Bug, History, CheckCircle, Siren, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/lib/location';
import { useEffect, useState, useMemo } from 'react';
import { getWeatherForecast } from '@/ai/flows/get-weather-forecast';
import { type WeatherDataPoint } from '@/ai/flows/weather-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth.tsx';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, writeBatch, getDocs, where } from 'firebase/firestore';
import { CardSpotlight } from '@/components/ui/card-spotlight';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { generateTaskTimeline } from '@/ai/flows/task-generator';
import { format, parseISO, isFuture } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { type AnalyzeCropOutput } from '@/ai/ai-crop-scanner';
import { useToast } from '@/hooks/use-toast';

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

// ====== Field & Task Management ======

type Field = {
    id: string;
    name: string;
    crop: string;
    createdAt: { seconds: number };
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

type NewFieldInputs = {
    name: string;
    crop: string;
};

const categoryIcons = {
    Watering: <Droplet className="text-blue-500" />,
    Fertilizing: <Leaf className="text-green-500" />,
    "Pest Control": <Bug className="text-red-500" />,
    Planting: <Tractor className="text-yellow-500" />,
    Harvesting: <Tractor className="text-purple-500" />,
    Other: <SunSnow className="text-gray-500" />
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
                <Button size="sm">
                    <Plus className="mr-2" /> Add Field
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

function MyFieldsAndTasks() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const { location } = useLocation();
    const { toast } = useToast();

    const fieldsQuery = user ? query(collection(firestore, `users/${user.uid}/fields`), orderBy('createdAt', 'desc')) : null;
    const { data: fields, loading: fieldsLoading } = useCollection<Field>(fieldsQuery);

    const tasksQuery = user ? query(collection(firestore, `users/${user.uid}/tasks`), orderBy('date', 'asc')) : null;
    const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);
    
    const [generatingFieldId, setGeneratingFieldId] = useState<string | null>(null);
    const [isRefreshingAll, setIsRefreshingAll] = useState(false);
    const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);


    // Group tasks by field ID for easy lookup
    const tasksByField = useMemo(() => {
        if (!tasks) return {};
        return tasks.reduce((acc, task) => {
            if (!acc[task.fieldId]) {
                acc[task.fieldId] = [];
            }
            acc[task.fieldId].push(task);
            return acc;
        }, {} as Record<string, Task[]>);
    }, [tasks]);

    // Find the next upcoming action for a given field
    const getNextAction = (fieldId: string) => {
        const fieldTasks = tasksByField[fieldId] || [];
        const upcomingTasks = fieldTasks.filter(task => !task.completed && isFuture(parseISO(task.date)));
        return upcomingTasks.length > 0 ? upcomingTasks[0] : null;
    }

    const generateTasksForField = async (field: Field) => {
        if (!user || !location) return;
        setGeneratingFieldId(field.id);
        try {
            const plantingDate = field.createdAt 
                ? new Date(field.createdAt.seconds * 1000)
                : new Date();

            const result = await generateTaskTimeline({
                crop: field.crop,
                location: {
                    city: location.city,
                    country: location.country,
                    latitude: location.lat,
                    longitude: location.lon,
                },
                plantingDate: format(plantingDate, 'yyyy-MM-dd')
            });

            const tasksCollection = collection(firestore, `users/${user.uid}/tasks`);
            for (const task of result.tasks) {
                await addDoc(tasksCollection, { ...task, fieldId: field.id, completed: false });
            }
        } catch (error: any) {
            console.error("Failed to generate tasks:", error);
            const errorMessage = error.message || "An unknown error occurred.";
            if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('resource has been exhausted')) {
                toast({
                    title: "AI Busy",
                    description: "The AI is currently busy or your free credits may have been used up. Please try again later.",
                    variant: "destructive"
                });
            } else {
                 toast({
                    title: "Generation Failed",
                    description: "Could not generate a timeline for this field.",
                    variant: "destructive"
                });
            }
        } finally {
            setGeneratingFieldId(null);
        }
    };
    
    const refreshAllTasks = async () => {
        if (!fields) return;
        setIsRefreshingAll(true);
        try {
            for (const field of fields) {
                await generateTasksForField(field);
            }
        } catch (error: any) {
             console.error("Failed to refresh tasks:", error);
             toast({
                title: "Refresh Failed",
                description: "Could not refresh all task timelines.",
                variant: "destructive"
            });
        } finally {
            setIsRefreshingAll(false);
        }
    }

    const handleToggleComplete = async (task: Task) => {
        if (!user) return;
        const taskDocRef = doc(firestore, `users/${user.uid}/tasks`, task.id);
        await updateDoc(taskDocRef, { completed: !task.completed });
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!user) return;
        const taskDocRef = doc(firestore, `users/${user.uid}/tasks`, taskId);
        await deleteDoc(taskDocRef);
    }
    
    const handleDeleteField = async () => {
        if (!user || !fieldToDelete) return;
        
        const fieldDocRef = doc(firestore, `users/${user.uid}/fields`, fieldToDelete.id);
        
        // Find and delete all tasks for this field
        const tasksQuery = query(collection(firestore, `users/${user.uid}/tasks`), where('fieldId', '==', fieldToDelete.id));
        const tasksSnapshot = await getDocs(tasksQuery);
        const batch = writeBatch(firestore);
        tasksSnapshot.forEach(taskDoc => {
            batch.delete(taskDoc.ref);
        });

        // Delete the field itself
        batch.delete(fieldDocRef);

        await batch.commit();
        setFieldToDelete(null); // Close the dialog
    }
    
    const isLoading = fieldsLoading || tasksLoading;

    return (
        <>
        <CardSpotlight className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>My Fields & Tasks</CardTitle>
                    <CardDescription>Manage your fields and view their AI-generated timelines.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={refreshAllTasks} disabled={isRefreshingAll || fieldsLoading || !fields?.length || !!generatingFieldId} size="sm" variant="secondary">
                        {isRefreshingAll ? <Loader2 className="animate-spin mr-2" /> : <Calendar className="mr-2" />}
                        {isRefreshingAll ? 'Refreshing...' : 'Refresh All Tasks'}
                    </Button>
                    <AddFieldModal />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading && <div className="text-center p-8"><Loader2 className="mx-auto animate-spin" /></div>}
                {!isLoading && (!fields || fields.length === 0) ? (
                    <div className="text-center text-muted-foreground p-8">
                        <Tractor className="mx-auto h-12 w-12 mb-4"/>
                        <h3 className="font-semibold">No fields yet</h3>
                        <p>Add your first field to start getting personalized advice.</p>
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="w-full space-y-2">
                        {fields?.map(field => {
                            const fieldTasks = tasksByField[field.id] || [];
                            const nextAction = getNextAction(field.id);
                            const isGenerating = generatingFieldId === field.id;
                            return (
                                <AccordionItem value={field.id} key={field.id} className="border-none">
                                    <CardSpotlight className="p-0">
                                        <div className="flex items-center w-full p-4">
                                            <AccordionTrigger className="flex-1 p-0 pr-4 w-full cursor-pointer hover:no-underline [&[data-state=open]>svg]:text-primary">
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-4">
                                                        <Tractor className="h-6 w-6 text-primary" />
                                                        <div>
                                                            <h3 className="font-semibold text-left">{field.name}</h3>
                                                            <Badge variant="secondary">{field.crop}</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-xs text-muted-foreground">Next Action</p>
                                                        {nextAction ? (
                                                            <p className="font-semibold">{nextAction.title} by {format(parseISO(nextAction.date), 'MMM d')}</p>
                                                        ) : (
                                                            <p className="font-semibold text-muted-foreground">All caught up!</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 z-10 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                                                onClick={(e) => { e.stopPropagation(); setFieldToDelete(field); }}
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                        <AccordionContent className="px-4 pb-4">
                                            {fieldTasks.length > 0 ? (
                                                <div className="space-y-2">
                                                    {fieldTasks.map(task => (
                                                        <motion.div 
                                                            key={task.id}
                                                            className={`flex items-start gap-3 p-3 rounded-md transition-all ${task.completed ? 'bg-secondary/50 text-muted-foreground opacity-70' : 'bg-secondary/20'}`}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                        >
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleToggleComplete(task)}>
                                                              <Check className={`transition-all ${task.completed ? 'opacity-100 text-green-500' : 'opacity-50'}`} />
                                                            </Button>
                                                            <div className="flex-1">
                                                                <p className={`font-medium ${task.completed && 'line-through'}`}>{task.title}</p>
                                                                <p className="text-sm text-muted-foreground">{task.description}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex flex-col items-end text-right">
                                                                    <Badge variant="outline" className="flex items-center gap-1.5 mb-1">
                                                                        {categoryIcons[task.category as keyof typeof categoryIcons]}
                                                                        {task.category}
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground">{format(parseISO(task.date), 'EEEE, MMM d')}</span>
                                                                </div>
                                                                 <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                                                    onClick={() => handleDeleteTask(task.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4"/>
                                                                </Button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center p-4 text-muted-foreground">
                                                    <p className="mb-2">No tasks found for this field.</p>
                                                    <Button onClick={() => generateTasksForField(field)} size="sm" disabled={isGenerating || isRefreshingAll}>
                                                        {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Calendar className="mr-2" />}
                                                        {isGenerating ? 'Generating...' : 'Generate Timeline'}
                                                    </Button>
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </CardSpotlight>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                )}
            </CardContent>
        </CardSpotlight>

        <AlertDialog open={!!fieldToDelete} onOpenChange={(open) => !open && setFieldToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this field?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the field "{fieldToDelete?.name}" and all of its associated tasks. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteField} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}

type Scan = AnalyzeCropOutput & {
    id: string;
    imageUrl: string;
    createdAt: { seconds: number, nanoseconds: number };
}


function ScanHistoryCard() {
    const { user } = useAuth();
    const firestore = useFirestore();
    const scansQuery = user ? query(collection(firestore, `users/${user.uid}/scans`), orderBy('createdAt', 'desc'), limit(5)) : null;
    const { data: scans, loading } = useCollection<Scan>(scansQuery);
    const [selectedScan, setSelectedScan] = useState<Scan | null>(null);

    return (
        <>
        <CardSpotlight className="mt-6">
            <CardHeader>
                <CardTitle>Recent Scans</CardTitle>
                <CardDescription>A look at your recent crop health analyses.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading && <div className="text-center p-8"><Loader2 className="mx-auto animate-spin" /></div>}
                {!loading && (!scans || scans.length === 0) ? (
                    <div className="text-center text-muted-foreground p-8">
                        <History className="mx-auto h-12 w-12 mb-4"/>
                        <h3 className="font-semibold">No scan history</h3>
                        <p>Use the Crop Scanner to start building your history.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {scans?.map(scan => (
                            <motion.div
                                key={scan.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={() => setSelectedScan(scan)}
                                className="flex items-center gap-4 p-2 rounded-md hover:bg-secondary/30 transition-colors cursor-pointer"
                            >
                                <Image src={scan.imageUrl} alt={scan.disease} width={48} height={48} className="rounded-md object-cover h-12 w-12" />
                                <div className="flex-1">
                                    <p className="font-semibold">{scan.disease}</p>
                                    <p className="text-sm text-muted-foreground">{scan.createdAt ? format(new Date(scan.createdAt.seconds * 1000), 'MMM d, yyyy') : 'N/A'}</p>
                                </div>
                                <div className='flex items-center gap-2'>
                                    {scan.disease.toLowerCase() === 'healthy' ? (
                                        <CheckCircle className="h-6 w-6 text-green-500" />
                                    ) : (
                                        <Siren className="h-6 w-6 text-destructive" />
                                    )}
                                    <Eye className="h-5 w-5 text-muted-foreground"/>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </CardContent>
        </CardSpotlight>

        <Dialog open={!!selectedScan} onOpenChange={(isOpen) => !isOpen && setSelectedScan(null)}>
            <DialogContent className="max-w-3xl">
                {selectedScan && (
                    <>
                    <DialogHeader>
                        <DialogTitle>Scan Result: {selectedScan.disease}</DialogTitle>
                        <DialogDescription>
                            Scanned on {selectedScan.createdAt ? format(new Date(selectedScan.createdAt.seconds * 1000), 'MMMM d, yyyy, p') : 'N/A'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid md:grid-cols-2 gap-6 mt-4 max-h-[70vh] overflow-y-auto">
                        <div className="relative aspect-video">
                            <Image src={selectedScan.imageUrl} alt="Scanned crop" fill={true} objectFit="contain" className="rounded-md" />
                        </div>
                        <div className="space-y-4">
                            <Accordion type="single" collapsible className="w-full" defaultValue="description">
                                <AccordionItem value="description">
                                    <AccordionTrigger>Description</AccordionTrigger>
                                    <AccordionContent>{selectedScan.description}</AccordionContent>
                                </AccordionItem>
                                {selectedScan.symptoms && selectedScan.symptoms.length > 0 && (
                                     <AccordionItem value="symptoms">
                                        <AccordionTrigger>Symptoms</AccordionTrigger>
                                        <AccordionContent>
                                            <ul className="list-disc pl-5 space-y-1">
                                                {selectedScan.symptoms.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                )}
                                {selectedScan.organicSolution && (
                                    <AccordionItem value="organic">
                                        <AccordionTrigger>Organic Solution</AccordionTrigger>
                                        <AccordionContent className="whitespace-pre-line">{selectedScan.organicSolution}</AccordionContent>
                                    </AccordionItem>
                                )}
                                {selectedScan.chemicalSolution && (
                                    <AccordionItem value="chemical">
                                        <AccordionTrigger>Chemical Solution</AccordionTrigger>
                                        <AccordionContent className="whitespace-pre-line">{selectedScan.chemicalSolution}</AccordionContent>
                                    </AccordionItem>
                                )}
                                {selectedScan.prevention && selectedScan.prevention.length > 0 && (
                                    <AccordionItem value="prevention">
                                        <AccordionTrigger>Prevention</AccordionTrigger>
                                        <AccordionContent>
                                            <ul className="list-disc pl-5 space-y-1">
                                                {selectedScan.prevention.map((p, i) => <li key={i}>{p}</li>)}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                )}
                            </Accordion>
                        </div>
                    </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
        </>
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
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <MyFieldsAndTasks />
      </motion.div>

       <motion.div
        variants={FADE_IN}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <ScanHistoryCard />
      </motion.div>
    </div>
  );
}
