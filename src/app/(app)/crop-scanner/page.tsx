'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Lottie from 'lottie-react';
import { Camera, Upload, CheckCircle, AlertTriangle, Lightbulb, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import analyzingAnimation from '../../../../public/lottie/analyzing.json';
import { alertNearbyDiseases } from '@/ai/flows/geo-location-alerts';
import { analyzeCrop } from '@/ai/ai-crop-scanner';
import { useAuth } from '@/lib/auth';

type ScanResult = {
  disease: string;
  solution: string;
};

export default function CropScannerPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setStatus('idle');
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!imagePreview || !user) return;
    setStatus('analyzing');
    setError(null);
    
    try {
      const analysisResult = await analyzeCrop({
        photoDataUri: imagePreview,
        language: navigator.language || 'en',
      });
      
      const scanResult: ScanResult = {
        disease: analysisResult.disease,
        solution: analysisResult.solution,
      };

      setResult(scanResult);
      setStatus('success');
      
      // Trigger geo-location alert in the background
      // Only send alert if a disease was detected
      if (scanResult.disease && scanResult.disease.toLowerCase() !== 'healthy') {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              await alertNearbyDiseases({
                latitude,
                longitude,
                disease: scanResult.disease,
                sourceUserId: user.uid,
              });
              toast({
                title: "Community Alert Sent",
                description: `Notified nearby farmers of ${scanResult.disease}.`,
              });
            } catch (error) {
               console.error("Failed to send location alert:", error);
               // Don't bother the user with a toast for this background task failing
            }
          },
          (error) => {
            console.error("Geolocation error for alerts:", error);
            toast({
                variant: 'destructive',
                title: "Could not send alert",
                description: "Could not get your location to alert nearby farmers."
            })
          }
        );
      }

    } catch (err) {
        console.error("Error analyzing crop:", err);
        setError("The AI assistant could not analyze the image. It might be busy. Please try again in a moment.");
        setStatus('error');
    }
  };

  const reset = () => {
      setImagePreview(null);
      setStatus('idle');
      setResult(null);
      setError(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold font-headline">AI Crop Scanner</h1>
        <p className="text-muted-foreground mt-2">Upload an image of your crop to diagnose diseases and get solutions.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <Card className="glass-card">
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
            
            {!imagePreview && (
                <Button onClick={() => fileInputRef.current?.click()} className="mt-4 w-full">
                <Upload className="mr-2" /> Upload Image
                </Button>
            )}

            {imagePreview && (
              <div className="flex flex-col w-full gap-2 mt-4">
                 <Button onClick={handleScan} disabled={status === 'analyzing' || !user} className="w-full">
                    {status === 'analyzing' ? <><Loader className="animate-spin mr-2"/>Analyzing...</> : 'Scan Crop'}
                </Button>
                <Button onClick={reset} variant="outline" className="w-full" disabled={status === 'analyzing'}>
                    <Upload className="mr-2" /> Upload New Image
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="glass-card min-h-[300px]">
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[300px]">
                  {status === 'idle' && (
                     <div className="text-center text-muted-foreground">
                        <p>Analysis results will appear here.</p>
                     </div>
                  )}
                  {status === 'analyzing' && (
                    <div className="text-center">
                      <Lottie animationData={analyzingAnimation} style={{ height: 150 }} />
                      <p className="font-semibold text-primary">Analyzing image...</p>
                      <p className="text-sm text-muted-foreground">This may take a moment.</p>
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="text-center text-destructive-foreground bg-destructive/80 p-6 rounded-lg">
                        <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
                        <h3 className="font-semibold mb-2">Analysis Failed</h3>
                        <p className="text-sm">{error}</p>
                    </div>
                  )}
                  {status === 'success' && result && (
                    <div className="w-full text-left">
                      <motion.h3
                        className="text-2xl font-bold font-headline mb-4 flex items-center"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                         <CheckCircle className="text-green-500 mr-2" /> Diagnosis Complete
                      </motion.h3>
                      <motion.div
                        className="space-y-4"
                        initial="hidden"
                        animate="visible"
                        variants={{
                          visible: { transition: { staggerChildren: 0.1 } },
                          hidden: {},
                        }}
                      >
                        <motion.div variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 10 } }}>
                          <h4 className="font-semibold flex items-center"><AlertTriangle className="mr-2 h-4 w-4" />Disease Detected</h4>
                          <p className="text-lg font-bold text-destructive">{result.disease}</p>
                        </motion.div>
                        
                        <motion.div variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 10 } }}>
                          <h4 className="font-semibold flex items-center"><Lightbulb className="mr-2 h-4 w-4" />Recommended Solution</h4>
                          <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md whitespace-pre-line">{result.solution}</p>
                        </motion.div>
                      </motion.div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
