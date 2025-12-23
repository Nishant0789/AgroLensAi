'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { suggestCrops, generateGrowthRoadmap, type SuggestCropsOutput } from '@/ai/flows/newbie-to-pro-growth-roadmap';
import { Check, Loader, MapPin, Wheat, RefreshCw, DollarSign, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type CropSuggestion = SuggestCropsOutput['crops'][0];

const steps = [
  { id: 1, name: 'Crop Selection' },
  { id: 2, name: 'Growth Roadmap' },
];

export default function GuidePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState<{ name: string; lat: number, lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<CropSuggestion[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<CropSuggestion | null>(null);
  const [roadmap, setRoadmap] = useState<string | null>(null);

  const fetchLocationAndSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Get location name
          const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const geoData = await geoResponse.json();
          const locationName = geoData.city ? `${geoData.city}, ${geoData.localityInfo.administrative[1].name}` : 'your current location';
          setLocation({ name: locationName, lat: latitude, lon: longitude });

          // Get crop suggestions
          const result = await suggestCrops({ location: locationName });
          setSuggestions(result.crops);
        } catch (err) {
          console.error(err);
          setError('Could not fetch crop suggestions for your location. Please try again.');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        setError('Location access denied. Please enable it in your browser settings and try again.');
        setIsLoading(false);
      }
    );
  };
  
  useEffect(() => {
    fetchLocationAndSuggestions();
  }, []);

  const handleSelectCrop = async (crop: CropSuggestion) => {
    if (!location) return;
    setSelectedCrop(crop);
    setIsLoading(true);
    try {
      const result = await generateGrowthRoadmap({ location: location.name, cropType: crop.name });
      setRoadmap(result.roadmap);
      setCurrentStep(2);
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      setError('Could not generate the growth roadmap. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setSelectedCrop(null);
    setRoadmap(null);
    fetchLocationAndSuggestions();
  }
  
  const parseRoadmap = (text: string) => {
    const sections = text.split('\n\n- ');
    const title = sections.shift() || "Your Roadmap";
    const items = sections.map(section => {
        const [heading, ...contentParts] = section.split('\n  - ');
        const content = contentParts.join('\n- ');
        return {
            title: heading.replace(/:$/, ''),
            content: content
        };
    });
    return { title, items };
  }

  const ProfitabilityBadge = ({ level }: { level: 'High' | 'Medium' | 'Low' }) => {
    const variants = {
      High: { variant: 'default', className: 'bg-green-600' },
      Medium: { variant: 'secondary', className: 'bg-yellow-500' },
      Low: { variant: 'destructive', className: 'bg-red-500' },
    } as const;
    return (
       <Badge variant={variants[level].variant} className={variants[level].className}>
            <DollarSign className="mr-1 h-3 w-3" />
            {level} Profitability
       </Badge>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold font-headline">Newbie to Pro Guide</h1>
        <p className="text-muted-foreground mt-2">Your personalized path to a successful harvest.</p>
      </motion.div>
      
      <div className="flex justify-center mb-8">
        <ol className="flex items-center space-x-2">
          {steps.map((step, index) => (
            <li key={step.id} className="flex items-center">
              <div className="flex items-center">
                <span className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </span>
                <span className={`ml-2 font-medium ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}>{step.name}</span>
              </div>
              {index < steps.length - 1 && <div className="w-12 h-px bg-border mx-4" />}
            </li>
          ))}
        </ol>
      </div>

      <Card className="glass-card">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && (
              <>
                <CardHeader>
                  <CardTitle>AI Crop Suggestions for Your Area</CardTitle>
                  {location && <CardDescription>Based on your location: <span className="font-semibold text-primary">{location.name}</span></CardDescription>}
                </CardHeader>
                <CardContent className="p-6">
                  {isLoading && (
                     <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
                        <Loader className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Analyzing your location and climate...</p>
                      </div>
                  )}
                  {error && !isLoading && (
                    <div className="flex flex-col items-center justify-center min-h-[200px] gap-2 text-center">
                         <p className="text-destructive">{error}</p>
                         <Button onClick={fetchLocationAndSuggestions}><RefreshCw className="mr-2"/> Try Again</Button>
                    </div>
                  )}
                  {!isLoading && !error && suggestions.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-4">
                      {suggestions.map((crop) => (
                        <motion.div
                            key={crop.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="hover:shadow-lg hover:border-primary/50 transition-all h-full flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/>{crop.name}</CardTitle>
                                    <ProfitabilityBadge level={crop.profitability}/>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-muted-foreground">{crop.reason}</p>
                                </CardContent>
                                <div className="p-4 pt-0">
                                <Button onClick={() => handleSelectCrop(crop)} className="w-full">
                                    <Wheat className="mr-2" />
                                    Generate Guide for {crop.name}
                                </Button>
                                </div>
                            </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </>
            )}
            
            {currentStep === 2 && roadmap && selectedCrop && (
              <div>
                <CardHeader>
                  <CardTitle>{parseRoadmap(roadmap).title}</CardTitle>
                  <CardDescription>A step-by-step guide for growing <span className="font-semibold text-primary">{selectedCrop.name}</span> in <span className="font-semibold text-primary">{location?.name}</span>.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                    {parseRoadmap(roadmap).items.map((item, index) => (
                      <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger>{item.title}</AccordionTrigger>
                        <AccordionContent>
                           <div className="prose prose-sm max-w-none whitespace-pre-line text-muted-foreground">
                              {item.content}
                           </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                   <Button onClick={handleStartOver} variant="outline" className="mt-6 w-full">
                     <RefreshCw className="mr-2" />
                     Start Over
                    </Button>
                </CardContent>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  );
}
