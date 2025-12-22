'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { generateGrowthRoadmap } from '@/ai/flows/newbie-to-pro-growth-roadmap';
import { Check, Loader, MapPin, Wheat } from 'lucide-react';

const steps = [
  { id: 1, name: 'Your Farm' },
  { id: 2, name: 'Growth Roadmap' },
];

const formSchema = z.object({
  location: z.string().min(2, 'Please enter a valid location.'),
  cropType: z.string().min(2, 'Please enter a valid crop type.'),
});
type FormValues = z.infer<typeof formSchema>;

export default function GuidePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const result = await generateGrowthRoadmap(data);
      // Simple parsing of the returned string for accordion
      setRoadmap(result.roadmap);
      setCurrentStep(2);
    } catch (error) {
      console.error('Failed to generate roadmap:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
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
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>Tell us about your farm</CardTitle>
                  <CardDescription>This information will help us create a tailored plan for you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location (e.g., city, state)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="location" placeholder="e.g., Central Valley, California" {...register('location')} className="pl-10" />
                    </div>
                    {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cropType">Primary Crop</Label>
                    <div className="relative">
                      <Wheat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="cropType" placeholder="e.g., Corn, Soybeans, Wheat" {...register('cropType')} className="pl-10" />
                    </div>
                     {errors.cropType && <p className="text-sm text-destructive">{errors.cropType.message}</p>}
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                    Generate My Roadmap
                  </Button>
                </CardContent>
              </form>
            )}
            
            {currentStep === 2 && roadmap && (
              <div>
                <CardHeader>
                  <CardTitle>{parseRoadmap(roadmap).title}</CardTitle>
                  <CardDescription>Follow these steps for a successful season.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
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
                   <Button onClick={() => setCurrentStep(1)} variant="outline" className="mt-6 w-full">Start Over</Button>
                </CardContent>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  );
}
