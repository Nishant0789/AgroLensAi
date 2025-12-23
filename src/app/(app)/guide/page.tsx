'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { suggestCrops, generateGrowthRoadmap, type SuggestCropsOutput, type GrowthRoadmapOutput } from '@/ai/flows/newbie-to-pro-growth-roadmap';
import { Check, Loader, MapPin, Wheat, RefreshCw, DollarSign, Sparkles, Clock, Satellite, BrainCircuit, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLocation } from '@/lib/location';

type CropSuggestion = SuggestCropsOutput['crops'][0];

const steps = [
  { id: 1, name: 'Crop Selection' },
  { id: 2, name: 'Growth Roadmap' },
];

const loadingSteps = [
    { text: "Getting your location...", icon: MapPin },
    { text: "Analyzing local climate...", icon: Satellite },
    { text: "Suggesting profitable crops...", icon: BrainCircuit }
]

export default function GuidePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  
  const [loadingStatus, setLoadingStatus] = useState("Getting your location...");
  const { location, loading: locationLoading, error: locationError, fetchLocation } = useLocation();
  
  const [suggestions, setSuggestions] = useState<CropSuggestion[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<CropSuggestion | null>(null);
  const [roadmap, setRoadmap] = useState<GrowthRoadmapOutput | null>(null);

  const fetchSuggestions = async () => {
    if (!location) return;

    setSuggestionsLoading(true);
    setSuggestionsError(null);
    setSuggestions([]);
    
    try {
      setLoadingStatus("Suggesting profitable crops...");
      const result = await suggestCrops({ location: location.name });
      setSuggestions(result.crops);
    } catch (err) {
      console.error(err);
      setSuggestionsError('Could not fetch crop suggestions. The AI assistant might be busy. Please try again in a moment.');
    } finally {
      setSuggestionsLoading(false);
    }
  };
  
  useEffect(() => {
    if (location) {
      fetchSuggestions();
    }
  }, [location]);

  const handleSelectCrop = async (crop: CropSuggestion) => {
    if (!location) return;
    setSelectedCrop(crop);
    setRoadmapLoading(true);
    setSuggestionsError(null);
    try {
      const result = await generateGrowthRoadmap({ location: location.name, cropType: crop.name });
      setRoadmap(result);
      setCurrentStep(2);
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
      setSuggestionsError('Could not generate the growth roadmap. Please try again.');
    } finally {
      setRoadmapLoading(false);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setSelectedCrop(null);
    setRoadmap(null);
    if (location) {
        fetchSuggestions();
    } else {
        fetchLocation();
    }
  }

  const handleRetry = () => {
      if (!location) {
          fetchLocation();
      } else {
          fetchSuggestions();
      }
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

  const LoadingIndicator = () => (
     <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <Loader className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{suggestionsLoading ? loadingStatus : 'Fetching your location...'}</p>
      </div>
  );

  const ErrorDisplay = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-2 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <p className="text-destructive max-w-sm">{error}</p>
            <Button onClick={onRetry}><RefreshCw className="mr-2"/> Try Again</Button>
      </div>
  );

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

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>AI Crop Suggestions for Your Area</CardTitle>
                {location && !locationLoading && <CardDescription>Based on your location: <span className="font-semibold text-primary">{location.name}</span></CardDescription>}
              </CardHeader>
              <CardContent className="p-6">
                {(locationLoading || (location && suggestionsLoading)) && <LoadingIndicator />}
                
                {!locationLoading && locationError && <ErrorDisplay error={locationError} onRetry={fetchLocation} />}

                {location && !suggestionsLoading && suggestionsError && <ErrorDisplay error={suggestionsError} onRetry={fetchSuggestions} />}
                
                {location && !suggestionsLoading && !suggestionsError && suggestions.length > 0 && (
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
                              <Button onClick={() => handleSelectCrop(crop)} className="w-full" disabled={roadmapLoading}>
                                  {roadmapLoading && selectedCrop?.name === crop.name ? <Loader className="mr-2 animate-spin"/> : <Wheat className="mr-2" />}
                                  {roadmapLoading && selectedCrop?.name === crop.name ? 'Generating...' : `Generate Guide for ${crop.name}`}
                              </Button>
                              </div>
                          </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {currentStep === 2 && roadmap && selectedCrop && (
            <div>
                 {roadmapLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
                        <Loader className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Generating your personalized roadmap...</p>
                    </div>
                ) : (
                <>
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold font-headline">{roadmap.title}</h2>
                        <p className="text-muted-foreground">A step-by-step guide for growing <span className="font-semibold text-primary">{selectedCrop.name}</span> in <span className="font-semibold text-primary">{location?.name}</span>.</p>
                    </div>

                    <div className="relative">
                        <div className="absolute left-4 top-4 h-full border-l-2 border-border border-dashed"></div>
                        {roadmap.roadmap.map((item, index) => (
                        <motion.div 
                            key={index} 
                            className="relative pl-10 mb-8"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="absolute left-0 top-3 flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground font-bold">
                            {index + 1}
                            </div>
                            <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>{item.title}</CardTitle>
                                <CardDescription className="flex items-center gap-2 pt-1">
                                <Clock className="h-4 w-4" />
                                <span>{item.duration}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-line text-muted-foreground text-sm">{item.description}</p>
                            </CardContent>
                            </Card>
                        </motion.div>
                        ))}
                    </div>
                    <Button onClick={handleStartOver} variant="outline" className="mt-6 w-full">
                        <RefreshCw className="mr-2" />
                        Start Over
                    </Button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
