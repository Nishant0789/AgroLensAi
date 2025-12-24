'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Lottie from 'lottie-react';
import { Camera, Upload, CheckCircle, AlertTriangle, Loader, RefreshCw, Leaf, Siren, Sprout, TestTube2, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import analyzingAnimation from '../../../../public/lottie/analyzing.json';
import { alertNearbyDiseases } from '@/ai/flows/geo-location-alerts';
import { analyzeCrop, type AnalyzeCropOutput } from '@/ai/ai-crop-scanner';
import { useAuth, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { translateContent } from '@/ai/flows/translate-content';
import { type TranslateContentInput } from '@/ai/flows/translate-content-types';
import { CardSpotlight } from '@/components/ui/card-spotlight';

type ScanResult = AnalyzeCropOutput;
type Status = 'idle' | 'analyzing' | 'translating' | 'success' | 'error';

const LanguageSwitcher = ({ language, onLanguageChange, disabled }: { language: string; onLanguageChange: (lang: string) => void; disabled: boolean }) => (
    <div className="flex items-center justify-center gap-2 mb-4">
        <Languages className="text-muted-foreground"/>
        <Tabs defaultValue={language} onValueChange={onLanguageChange} className="w-[150px]">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="English" disabled={disabled}>English</TabsTrigger>
                <TabsTrigger value="Hindi" disabled={disabled}>हिंदी</TabsTrigger>
            </TabsList>
        </Tabs>
    </div>
);

export default function CropScannerPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [isAlerting, setIsAlerting] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [originalResult, setOriginalResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('English');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const firestore = useFirestore();

  const resetState = () => {
    setImagePreview(null);
    setStatus('idle');
    setIsAlerting(false);
    setResult(null);
    setOriginalResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setStatus('idle');
        setResult(null);
        setOriginalResult(null);
        setError(null);
        setIsAlerting(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!imagePreview || !user || status === 'analyzing' || status === 'translating') return;
    
    setStatus('analyzing');
    setError(null);
    setResult(null);
    setOriginalResult(null);
    
    try {
      const analysisResult = await analyzeCrop({
        photoDataUri: imagePreview,
        language: 'English', // Always fetch in the base language first
      });

      if (!analysisResult || !analysisResult.disease) {
        throw new Error("The AI model did not return a valid analysis. Please try a different image.");
      }
      
      setOriginalResult(analysisResult); 
      setResult(analysisResult); // Show English result immediately

      if (language !== 'English') {
        setStatus('translating');
        const translatedResult = await translateContent({
            content: analysisResult,
            targetLanguage: language,
        } as TranslateContentInput);
        setResult(translatedResult);
      }
      
      setStatus('success');

      addDoc(collection(firestore, `users/${user.uid}/scans`), {
        userId: user.uid,
        imageUrl: imagePreview,
        disease: analysisResult.disease,
        solution: analysisResult.organicSolution,
        createdAt: serverTimestamp(),
      }).catch(e => console.error("Failed to save scan history:", e));
      
      if (analysisResult.disease && analysisResult.disease.toLowerCase() !== 'healthy') {
        setIsAlerting(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            alertNearbyDiseases({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              disease: analysisResult.disease,
              sourceUserId: user.uid,
            }).then(() => {
              toast({ title: "Community Alert Sent", description: `Notified nearby farmers of ${analysisResult.disease}.` });
            }).catch(error => {
              console.error("Failed to send location alert:", error);
              toast({ title: "Alert Failed", description: `Could not notify nearby farmers.`, variant: 'destructive' });
            }).finally(() => {
              setIsAlerting(false);
            });
          },
          (geoError) => {
            console.error("Geolocation error for alerts:", geoError);
            toast({ title: "Location Error", description: "Could not get your location to send an alert.", variant: 'destructive' });
            setIsAlerting(false);
          }
        );
      }
    } catch (err: any) {
        console.error("Error analyzing crop:", err);
        setError(err.message || "The AI assistant could not analyze the image. It might be busy. Please try again in a moment.");
        setStatus('error');
    }
  };

  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    if (status !== 'success' || !originalResult) {
      return;
    }
    
    if (lang === 'English') {
      setResult(originalResult);
      return;
    }

    setStatus('translating');
    try {
        const translatedResult = await translateContent({
            content: originalResult,
            targetLanguage: lang,
        } as TranslateContentInput);
        setResult(translatedResult);
    } catch(err) {
        console.error("Error translating content:", err);
        setError("Failed to translate the result. Please try again.");
    } finally {
        setStatus('success');
    }
  };

  const isHealthy = result?.disease.toLowerCase() === 'healthy';
  const isProcessing = status === 'analyzing' || status === 'translating';

  return (
    <div className="container mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-4"
      >
        <h1 className="text-3xl font-bold font-headline">AI Crop Scanner</h1>
        <p className="text-muted-foreground mt-2">Upload an image of your crop to diagnose diseases and get solutions.</p>
      </motion.div>
      <LanguageSwitcher language={language} onLanguageChange={handleLanguageChange} disabled={isProcessing} />

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <CardSpotlight>
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
            {imagePreview ? (
              <div className="relative w-full aspect-video">
                <Image src={imagePreview} alt="Crop preview" fill objectFit="contain" className="rounded-md" />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Camera className="mx-auto h-12 w-12 mb-4" />
                <h3 className="font-semibold mb-2">Upload or take a photo</h3>
                <p className="text-sm">For best results, use a clear image of the affected area.</p>
              </div>
            )}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            
            <div className='flex flex-col w-full gap-2 mt-4'>
              {!imagePreview && (
                  <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                  <Upload className="mr-2" /> Upload Image
                  </Button>
              )}

              {imagePreview && (status === 'idle' || status === 'error') && (
                <Button onClick={handleScan} disabled={isProcessing} className="w-full">
                    Scan Crop
                </Button>
              )}
              
              {status !== 'idle' && !isProcessing && (
                  <Button onClick={resetState} variant="outline" className="w-full">
                      <RefreshCw className="mr-2" /> Scan Another Crop
                  </Button>
              )}
            </div>
          </CardContent>
        </CardSpotlight>

        <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <CardSpotlight className="min-h-[300px]">
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[300px]">
                  {status === 'idle' && (
                     <div className="text-center text-muted-foreground">
                        <p>Analysis results will appear here.</p>
                     </div>
                  )}
                  {isProcessing && (
                    <div className="text-center">
                      {status === 'analyzing' ? (
                         <>
                           <Lottie animationData={analyzingAnimation} style={{ height: 150 }} />
                           <p className="font-semibold text-primary">Analyzing image...</p>
                           <p className="text-sm text-muted-foreground">This may take a moment.</p>
                         </>
                      ) : (
                         <>
                           <Loader className="w-12 h-12 animate-spin text-primary mb-4" />
                           <p className="font-semibold text-primary">Translating to {language}...</p>
                         </>
                      )}
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="text-center text-destructive-foreground bg-destructive/80 p-6 rounded-lg">
                        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
                        <h3 className="font-semibold mb-2">Analysis Failed</h3>
                        <p className="text-sm mb-4">{error}</p>
                        <Button onClick={handleScan} variant="secondary">
                            <RefreshCw className="mr-2"/> Try Again
                        </Button>
                    </div>
                  )}
                  {status === 'success' && result && (
                    <div className="w-full text-left">
                      <motion.div
                        className="mb-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                         <h3 className="text-2xl font-bold font-headline flex items-center">
                           {isHealthy ? <CheckCircle className="text-green-500 mr-2" /> : <Siren className="text-destructive mr-2" />}
                           {isHealthy ? 'Diagnosis: Healthy' : `Diagnosis: ${result.disease}`}
                         </h3>
                         <p className="text-sm text-muted-foreground mt-1">{result.description}</p>
                         {isAlerting && (
                             <p className="text-sm text-amber-500 flex items-center gap-2 mt-2"><Loader className="animate-spin w-4 h-4"/>Sending community alert...</p>
                         )}
                      </motion.div>
                      
                      <Accordion type="single" collapsible className="w-full" defaultValue={isHealthy ? '' : 'symptoms'}>
                        {!isHealthy ? (
                          <>
                            <AccordionItem value="symptoms">
                              <AccordionTrigger>Symptoms</AccordionTrigger>
                              <AccordionContent>
                                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                  {result.symptoms.map((symptom, i) => <li key={i}>{symptom}</li>)}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="organic">
                                <AccordionTrigger>
                                  <div className="flex items-center gap-2">
                                    <Leaf className="text-green-600" /> Organic Solution
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-sm text-muted-foreground whitespace-pre-line">{result.organicSolution}</p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="chemical">
                                <AccordionTrigger>
                                  <div className="flex items-center gap-2">
                                    <TestTube2 className="text-orange-500" /> Chemical Solution
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-sm text-muted-foreground whitespace-pre-line">{result.chemicalSolution}</p>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="prevention">
                                <AccordionTrigger>
                                  <div className="flex items-center gap-2">
                                    <Sprout className="text-blue-500" /> Prevention
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                        {result.prevention.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                          </>
                        ) : (
                            <div className="text-center text-muted-foreground pt-4">
                                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2"/>
                                <p className="font-semibold">Your crop looks great!</p>
                                <p className="text-sm">Keep up the good work.</p>
                            </div>
                         )}
                      </Accordion>
                    </div>
                  )}
                </CardContent>
              </CardSpotlight>
            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
