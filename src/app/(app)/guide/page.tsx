'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { generatePersonalizedGuide, type PersonalizedGuideOutput } from '@/ai/flows/newbie-to-pro-growth-roadmap';
import { Check, Loader, Wheat, RefreshCw, DollarSign, Sparkles, Clock, AlertTriangle, Languages } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLocation } from '@/lib/location';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { translateContent } from '@/ai/flows/translate-content';
import { type TranslateContentInput } from '@/ai/flows/translate-content-types';


type CropSuggestion = PersonalizedGuideOutput['suggestions'][0];
type GrowthRoadmap = PersonalizedGuideOutput['roadmap'];

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { location, loading: locationLoading, error: locationError, fetchLocation } = useLocation();
  
  const [guideData, setGuideData] = useState<PersonalizedGuideOutput | null>(null);
  const [originalGuideData, setOriginalGuideData] = useState<PersonalizedGuideOutput | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropSuggestion | null>(null);
  const [selectedRoadmap, setSelectedRoadmap] = useState<GrowthRoadmap | null>(null);
  const [language, setLanguage] = useState('English');

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
    setOriginalGuideData(null);
    setSelectedCrop(null);
    setSelectedRoadmap(null);
    setCurrentStep(1);
    setCooldown(10); // 10 second cooldown
    
    try {
      const result = await generatePersonalizedGuide({ location: location.name, language: 'English' });
      setOriginalGuideData(result);

      if (language === 'English') {
        setGuideData(result);
      } else {
        const translatedResult = await translateContent({
            content: result,
            targetLanguage: language,
        } as TranslateContentInput);
        setGuideData(translatedResult);
      }

      if (result.suggestions.length > 0) {
        const currentData = (language === 'English' ? result : guideData) || result;
        const roadmapCropName = result.roadmap.title.split(" for ")[1]?.split(" in ")[0];
        const topCrop = currentData.suggestions.find((s: any, i: number) => result.suggestions[i].name === roadmapCropName) || currentData.suggestions[0];
        
        setSelectedCrop(topCrop);
        setSelectedRoadmap(currentData.roadmap);
      }
    } catch (err) {
      console.error(err);
      setError('Could not fetch your personalized guide. The AI assistant might be busy. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    if (!originalGuideData) {
        if(location) fetchGuide();
        return;
    };
    
    setLoading(true);
    if (lang === 'English') {
        setGuideData(originalGuideData);
        // Also update selected crop and roadmap to english versions
        if (originalGuideData.suggestions.length > 0) {
            const roadmapCropName = originalGuideData.roadmap.title.split(" for ")[1]?.split(" in ")[0];
            const topCrop = originalGuideData.suggestions.find(s => s.name === roadmapCropName) || originalGuideData.suggestions[0];
            setSelectedCrop(topCrop);
            setSelectedRoadmap(originalGuideData.roadmap);
        }
        setLoading(false);
        return;
    }

    try {
        const translatedResult = await translateContent({
            content: originalGuideData,
            targetLanguage: lang
        } as TranslateContentInput);
        setGuideData(translatedResult);

        // find which crop was selected based on index
        const originalIndex = originalGuideData.suggestions.findIndex(s => s.name === selectedCrop?.name || s.name === originalGuideData.roadmap.title.split(" for ")[1]?.split(" in ")[0]);

        if (translatedResult.suggestions.length > 0) {
          const translatedTopCrop = translatedResult.suggestions[originalIndex] || translatedResult.suggestions[0];
          setSelectedCrop(translatedTopCrop);
          setSelectedRoadmap(translatedResult.roadmap);
        }

    } catch (err) {
        console.error('Translation failed', err);
        setError('Failed to translate the guide. Please try again.');
    } finally {
        setLoading(false);
    }
  }
  
  useEffect(() => {
    if (location && !guideData && !loading && !error) {
      fetchGuide();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleSelectCrop = (crop: CropSuggestion) => {
    if (!guideData || !originalGuideData) return;
    
    setSelectedCrop(crop);
    setCurrentStep(2);
    
    // find the original english crop name to find the correct roadmap
    const originalIndex = guideData.suggestions.findIndex(s => s.name === crop.name);
    const originalCrop = originalGuideData.suggestions[originalIndex];

    if (originalCrop.name === originalGuideData.roadmap.title.split(" for ")[1]?.split(" in ")[0]) {
      setSelectedRoadmap(guideData.roadmap);
    } else {
        // In this version, we don't regenerate roadmaps on the fly to save API calls.
        // We just show the pre-generated one for the top crop.
        alert("Detailed roadmap is shown for the top recommended crop. Other roadmaps can be generated in a future version.");
        setSelectedRoadmap(guideData.roadmap);
    }
  }

  const handleStartOver = () => {
    setCurrentStep(1);
  }
  
  const handleRegenerate = () => {
    fetchGuide();
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
    
    // Normalize level for safety
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
       <Card className="glass-card">
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
        </Card>

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
                <LanguageSwitcher language={language} onLanguageChange={handleLanguageChange} disabled={loading || locationLoading} />
                {(locationLoading || (loading && !guideData)) && <LoadingIndicator />}
                
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
          
          {currentStep === 2 && (
            <div>
                 <Card className="glass-card mb-8">
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
                 </Card>

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
                                <div className="absolute left-0 top-3 flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground font-bold">
                                {index + 1}
                                </div>
                                <Card className="ml-4 glass-card shadow-md">
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
                                </Card>
                            </motion.div>
                            ))}
                        </div>
                    )}
                     <div className="flex flex-col sm:flex-row gap-2 mt-6">
                        <Button onClick={handleStartOver} variant="outline" className="w-full">
                            <Wheat className="mr-2" /> Back to Crop Selection
                        </Button>
                        <Button onClick={handleRegenerate} variant="secondary" className="w-full" disabled={cooldown > 0 || loading}>
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
