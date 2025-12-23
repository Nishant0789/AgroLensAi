'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { generatePersonalizedGuide, type PersonalizedGuideOutput } from '@/ai/flows/newbie-to-pro-growth-roadmap';
import { Check, Loader, MapPin, Wheat, RefreshCw, DollarSign, Sparkles, Clock, Satellite, BrainCircuit, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLocation } from '@/lib/location';

type CropSuggestion = PersonalizedGuideOutput['suggestions'][0];
type GrowthRoadmap = PersonalizedGuideOutput['roadmap'];

const steps = [
  { id: 1, name: 'Crop Selection' },
  { id: 2, name: 'Growth Roadmap' },
];

export default function GuidePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { location, loading: locationLoading, error: locationError, fetchLocation } = useLocation();
  
  const [guideData, setGuideData] = useState<PersonalizedGuideOutput | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropSuggestion | null>(null);
  const [selectedRoadmap, setSelectedRoadmap] = useState<GrowthRoadmap | null>(null);

  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const fetchGuide = async () => {
    if (!location?.name || cooldown > 0) return;

    setLoading(true);
    setError(null);
    setGuideData(null);
    setSelectedCrop(null);
    setSelectedRoadmap(null);
    setCooldown(10); // 10 second cooldown
    
    try {
      const result = await generatePersonalizedGuide({ location: location.name });
      setGuideData(result);
      if (result.suggestions.length > 0) {
        // Find the crop from suggestions that matches the roadmap title crop
        const roadmapCropName = result.roadmap.title.split(" for ")[1]?.split(" in ")[0];
        const topCrop = result.suggestions.find(s => s.name === roadmapCropName) || result.suggestions[0];
        setSelectedCrop(topCrop);
        setSelectedRoadmap(result.roadmap);
      }
    } catch (err) {
      console.error(err);
      setError('Could not fetch your personalized guide. The AI assistant might be busy. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (location) {
      fetchGuide();
    }
  }, [location]);

  const handleSelectCrop = async (crop: CropSuggestion) => {
    if (!guideData) return;
    
    // If the roadmap for this crop is already generated, just show it
    if(guideData.roadmap.title.includes(crop.name)) {
        setSelectedCrop(crop);
        setSelectedRoadmap(guideData.roadmap);
        setCurrentStep(2);
        return;
    }

    // This part is a placeholder for generating a new roadmap on demand.
    // For this app, we'll just switch to the pre-generated one.
    // In a real app, you would make another AI call here.
    setSelectedCrop(crop);
    
    // For demonstration, we'll just use the existing roadmap and change the title
    const newRoadmap = {
        ...guideData.roadmap,
        title: `Growth Roadmap for ${crop.name} in ${location?.name}`
    }
    setSelectedRoadmap(newRoadmap);
    setCurrentStep(2);
  }

  const handleStartOver = () => {
    setCurrentStep(1);
    // Don't null out the data, so the user can go back and forth
  }
  
  const handleRegenerate = () => {
    setCurrentStep(1);
    setSelectedCrop(null);
    setGuideData(null);
    setSelectedRoadmap(null);
    setError(null);
    if (location) {
        fetchGuide();
    } else {
        fetchLocation();
    }
  }

  const handleRetry = () => {
      if (!location) {
          fetchLocation();
      } else {
          fetchGuide();
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

  const LoadingIndicator = ({text}: {text?: string}) => (
     <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <Loader className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{text || 'Generating your personalized guide...'}</p>
      </div>
  );

  const ErrorDisplay = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-2 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <p className="text-destructive max-w-sm">{error}</p>
            <Button onClick={onRetry} disabled={cooldown > 0}>
                {cooldown > 0 ? `Please wait... (${cooldown}s)` : <><RefreshCw className="mr-2"/> Try Again</>}
            </Button>
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
                {(locationLoading || loading) && <LoadingIndicator />}
                
                {!locationLoading && locationError && <ErrorDisplay error={locationError} onRetry={fetchLocation} />}

                {location && !loading && error && <ErrorDisplay error={error} onRetry={handleRetry} />}
                
                {guideData && guideData.suggestions.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {guideData.suggestions.map((crop) => (
                      <motion.div
                          key={crop.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                      >
                          <Card className={`hover:shadow-lg transition-all h-full flex flex-col ${selectedCrop?.name === crop.name ? 'border-primary' : 'hover:border-primary/50'}`}>
                              <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                      {selectedCrop?.name === crop.name && <Sparkles className="text-primary"/>}
                                      {crop.name}
                                    </CardTitle>
                                  <ProfitabilityBadge level={crop.profitability}/>
                              </CardHeader>
                              <CardContent className="flex-1">
                                  <p className="text-sm text-muted-foreground">{crop.reason}</p>
                              </CardContent>
                              <CardFooter>
                                <Button onClick={() => handleSelectCrop(crop)} className="w-full">
                                    <Wheat className="mr-2" /> View Growth Roadmap
                                </Button>
                              </CardFooter>
                          </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {currentStep === 2 && selectedRoadmap && selectedCrop && (
            <div>
                 <>
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold font-headline">{selectedRoadmap.title}</h2>
                        <p className="text-muted-foreground">A step-by-step guide for growing <span className="font-semibold text-primary">{selectedCrop.name}</span> in <span className="font-semibold text-primary">{location?.name}</span>.</p>
                    </div>

                    <div className="relative">
                        <div className="absolute left-4 top-4 h-full border-l-2 border-border border-dashed"></div>
                        {selectedRoadmap.roadmap.map((item, index) => (
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
                     <div className="flex flex-col sm:flex-row gap-2 mt-6">
                        <Button onClick={handleStartOver} variant="outline" className="w-full">
                            <Wheat className="mr-2" /> Back to Crop Selection
                        </Button>
                        <Button onClick={handleRegenerate} variant="secondary" className="w-full" disabled={cooldown > 0}>
                            {cooldown > 0 ? `Try again in ${cooldown}s` : <><RefreshCw className="mr-2" /> Regenerate Suggestions</>}
                        </Button>
                    </div>
                </>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
