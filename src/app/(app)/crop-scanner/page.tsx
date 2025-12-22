'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Lottie from 'lottie-react';
import { Camera, Upload, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import analyzingAnimation from '../../../../public/lottie/analyzing.json';
import { alertNearbyDiseases } from '@/ai/flows/geo-location-alerts';

type ScanResult = {
  disease: string;
  confidence: number;
  solution: string;
};

export default function CropScannerPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'success'>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setStatus('idle');
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!imagePreview) return;
    setStatus('analyzing');

    // Mock AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockResult: ScanResult = {
      disease: 'Northern Corn Leaf Blight',
      confidence: 95.4,
      solution: 'Apply a foliar fungicide containing pyraclostrobin or tebuconazole. Ensure good field drainage and consider resistant hybrids for future planting seasons. This solution is provided in your local language for better understanding.',
    };
    setResult(mockResult);
    setStatus('success');
    
    // Trigger geo-location alert
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await alertNearbyDiseases({
            latitude,
            longitude,
            disease: mockResult.disease,
          });
          toast({
            title: "Location Alert Sent",
            description: `Notified nearby farmers of ${mockResult.disease}.`,
          });
        } catch (error) {
           console.error("Failed to send location alert:", error);
           toast({
            variant: "destructive",
            title: "Alert Error",
            description: "Could not send location alert.",
          });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          variant: "destructive",
          title: "Geolocation Error",
          description: "Could not get your location to send an alert.",
        });
      }
    );
  };

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

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="glass-card">
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
            {imagePreview ? (
              <div className="relative w-full aspect-video">
                <Image src={imagePreview} alt="Crop preview" layout="fill" objectFit="contain" className="rounded-md" />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Camera className="mx-auto h-12 w-12 mb-4" />
                <h3 className="font-semibold mb-2">Upload or take a photo</h3>
                <p className="text-sm">For best results, use a clear image of the affected area.</p>
              </div>
            )}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} className="mt-4 w-full">
              <Upload className="mr-2" /> Upload Image
            </Button>
            {imagePreview && (
              <Button onClick={handleScan} disabled={status === 'analyzing'} className="mt-2 w-full">
                {status === 'analyzing' ? 'Analyzing...' : 'Scan Crop'}
              </Button>
            )}
          </CardContent>
        </Card>

        <AnimatePresence>
          {status !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="glass-card min-h-[300px]">
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  {status === 'analyzing' && (
                    <div className="text-center">
                      <Lottie animationData={analyzingAnimation} style={{ height: 150 }} />
                      <p className="font-semibold text-primary">Analyzing image...</p>
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
                          <h4 className="font-semibold">Confidence</h4>
                          <div className="flex items-center gap-2">
                            <Progress value={result.confidence} className="w-full" />
                            <span className="font-mono text-sm">{result.confidence}%</span>
                          </div>
                        </motion.div>
                        <motion.div variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 10 } }}>
                          <h4 className="font-semibold flex items-center"><Lightbulb className="mr-2 h-4 w-4" />Recommended Solution</h4>
                          <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">{result.solution}</p>
                        </motion.div>
                      </motion.div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
