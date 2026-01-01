'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, Loader, Wheat, RefreshCw, DollarSign, Sparkles, Clock, AlertTriangle, Languages } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLocation } from '@/lib/location';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { translateContent } from '@/ai/flows/translate-content';
import { type TranslateContentInput } from '@/ai/flows/translate-content-types';
import { CardSpotlight } from '@/components/ui/card-spotlight';
import { useAIData, type CropSuggestion, type GrowthRoadmap } from '@/lib/ai-data-provider';


const steps = [
  { id: 1, name: 'Crop Selection' },
  { id: 2, name: 'Growth Roadmap' },
];

const LanguageSwitcher = ({ language, onLanguageChange, disabled }: { language: string; onLanguageChange: (lang: string) => void; disabled: boolean }) => (
    <div className="flex items-center justify-center gap-2 my-4">
        <Languages className="text-muted-foreground"/>
        <Tabs defaultValue={language} onValueChange={onLanguageChange} className="w-[150px]">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="English" disabled={disabled}>English</TabsTrigger>
                <TabsTrigger value="Hindi" disabled={disabled}>हिंदी</TabsTrigger>
            </TabsList>
        </Tabs>
    </div>
);

export default function GuidePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const { location, loading: locationLoading, error: locationError, fetchLocation } = useLocation();
  
  const { 
    guideData: originalGuideData, 
    loading: guideLoading, 
    error: guideError, 
    fetchGuide,
    cooldown
  } = useAIData();

  const [displayGuideData, setDisplayGuideData] = useState(originalGuideData);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const [selectedCrop, setSelectedCrop] = useState<CropSuggestion | null>(null);
  const [selectedRoadmap, setSelectedRoadmap] = useState<GrowthRoadmap | null>(null);
  const [language, setLanguage] = useState('English');

  const loading = guideLoading || translationLoading;
  const error = guideError || translationError;

  // Effect to set initial data and selection when original data loads
  useEffect(() => {
    if (originalGuideData) {
      setDisplayGuideData(originalGuideData);
      setLanguage('English'); // Reset to english when new original data comes
      if (originalGuideData.suggestions.length > 0) {
          const roadmapCropName = originalGuideData.roadmap.title.split(" for ")[1]?.split(" in ")[0];
          const topCrop = originalGuideData.suggestions.find(s => s.name === roadmapCropName) || originalGuideData.suggestions[0];
          setSelectedCrop(topCrop);
          setSelectedRoadmap(originalGuideData.roadmap);
      }
    }
  }, [originalGuideData]);

  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    if (!originalGuideData) return;
    
    setTranslationLoading(true);
    setTranslationError(null);

    if (lang === 'English') {
        setDisplayGuideData(originalGuideData);
        if (originalGuideData.suggestions.length > 0) {
            const roadmapCropName = originalGuideData.roadmap.title.split(" for ")[1]?.split(" in ")[0];
            const topCrop = originalGuideData.suggestions.find(s => s.name === roadmapCropName) || originalGuideData.suggestions[0];
            setSelectedCrop(topCrop);
            setSelectedRoadmap(originalGuideData.roadmap);
        }
        setTranslationLoading(false);
        return;
    }

    try {
        const translatedResult = await translateContent({
            content: originalGuideData,
            targetLanguage: lang
        } as TranslateContentInput);
        setDisplayGuideData(translatedResult);

        if (translatedResult.suggestions.length > 0) {
          const originalRoadmapCropName = originalGuideData.roadmap.title.split(" for ")[1]?.split(" in ")[0];
          const topCropIndex = originalGuideData.suggestions.findIndex(s => s.name === originalRoadmapCropName);
          const topCrop = translatedResult.suggestions[topCropIndex > -1 ? topCropIndex : 0];
          setSelectedCrop(topCrop);
          setSelectedRoadmap(translatedResult.roadmap);
        }

    } catch (err: any) {
        console.error('Translation failed', err);
        const errorMessage = err.message || "An unknown error occurred.";
        if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('resource has been exhausted')) {
            setTranslationError("The AI is currently busy or your free credits may have been used up. Please try again later.");
        } else {
            setTranslationError('Failed to translate the guide. Please try again.');
        }
    } finally {
        setTranslationLoading(false);
    }
  }
  
  const handleSelectCrop = (crop: CropSuggestion) => {
    if (!displayGuideData || !originalGuideData) return;
    
    setSelectedCrop(crop);
    setCurrentStep(2);
    
    const originalIndex = displayGuideData.suggestions.findIndex(s => s.name === crop.name);
    const originalCropName = originalGuideData.suggestions[originalIndex]?.name;
    const originalRoadmapCropName = originalGuideData.roadmap.title.split(" for ")[1]?.split(" in ")[0];

    if (originalCropName === originalRoadmapCropName) {
      setSelectedRoadmap(displayGuideData.roadmap);
    } else {
        alert("Detailed roadmap is shown for the top recommended crop. Other roadmaps can be generated in a future version.");
        setSelectedRoadmap(displayGuideData.roadmap);
    }
  }

  const handleStartOver = () => {
    setCurrentStep(1);
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
    
    const safeLevel = ['High', 'Medium', 'Low'].includes(level) ? level : 'Medium';

    return (
       <Badge variant={variants[safeLevel].variant} className={variants[safeLevel].className}>
            <DollarSign className="mr-1 h-3 w-3" />
            {safeLevel} Profitability
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
    <div className="container mx-auto max-w-4xl space-y-8">
       <CardSpotlight>
          <CardContent className="p-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-3xl font-bold font-headline">Newbie to Pro Guide</h1>
              <p className="text-muted-foreground mt-2">Your personalized path to a successful harvest.</p>
            </motion.div>
            
            <div className="flex justify-center mt-8">
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
          </CardContent>
        </CardSpotlight>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <CardSpotlight>
              <CardHeader>
                <CardTitle>AI Crop Suggestions for Your Area</CardTitle>
                {location && !locationLoading && <CardDescription>Based on your location: <span className="font-semibold text-primary">{location.name}</span></CardDescription>}
              </CardHeader>
              <CardContent className="p-6">
                <LanguageSwitcher language={language} onLanguageChange={handleLanguageChange} disabled={loading || locationLoading} />
                {(locationLoading || (guideLoading && !displayGuideData)) && <LoadingIndicator />}
                {translationLoading && <LoadingIndicator text="Translating..."/>}
                
                {!locationLoading && locationError && <ErrorDisplay error={locationError} onRetry={fetchLocation} />}

                {location && !loading && error && <ErrorDisplay error={error} onRetry={handleRetry} />}
                
                {displayGuideData && displayGuideData.suggestions.length > 0 && !loading && !error && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {displayGuideData.suggestions.map((crop) => (
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
            </CardSpotlight>
          )}
          
          {currentStep === 2 && (
            <div>
                 <CardSpotlight className="mb-8">
                    <CardContent className="p-6 text-center">
                        {loading && <LoadingIndicator text="Translating roadmap..."/>}
                        {error && !loading && <ErrorDisplay error={error} onRetry={() => selectedCrop && handleSelectCrop(selectedCrop)}/>}
                        {selectedRoadmap && selectedCrop && !loading && (
                            <>
                                <h2 className="text-3xl font-bold font-headline">{selectedRoadmap.title}</h2>
                                <p className="text-muted-foreground">A step-by-step guide for growing <span className="font-semibold text-primary">{selectedCrop.name}</span> in <span className="font-semibold text-primary">{location?.name}</span>.</p>
                            </>
                        )}
                    </CardContent>
                 </CardSpotlight>

                    {selectedRoadmap && !loading && (
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
                                <CardSpotlight className="ml-4">
                                <CardHeader>
                                    <CardTitle>{item.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 pt-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{item.duration}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-line text-sm text-muted-foreground">{item.description}</p>
                                </CardContent>
                                </CardSpotlight>
                            </motion.div>
                            ))}
                        </div>
                    )}
                     <div className="flex flex-col sm:flex-row gap-2 mt-6">
                        <Button onClick={handleStartOver} variant="outline" className="w-full">
                            <Wheat className="mr-2" /> Back to Crop Selection
                        </Button>
                        <Button onClick={handleRetry} variant="secondary" className="w-full" disabled={cooldown > 0 || loading}>
                            {cooldown > 0 ? `Try again in ${cooldown}s` : <><RefreshCw className="mr-2" /> Regenerate Suggestions</>}
                        </Button>
                    </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
