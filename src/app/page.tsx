'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Camera, LayoutDashboard, Map, Sparkles, StepForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { useAuth } from '@/lib/auth.tsx';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CardSpotlight } from '@/components/ui/card-spotlight';

const featureVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
    },
  }),
};

const features = [
  { icon: Camera, title: "AI Crop Scanner", description: "Instantly identify diseases with a snap." },
  { icon: Map, title: "Geo-Location Alerts", description: "Get warned about outbreaks in your area." },
  { icon: LayoutDashboard, title: "Farmer Dashboard", description: "Track your farm's health over time." },
  { icon: Bot, title: "Agro-Consultant", description: "AI-powered advice, 24/7." },
  { icon: StepForward, title: "Newbie to Pro Guide", description: "Personalized roadmap to success." },
  { icon: Sparkles, title: "Weather Module", description: "7-day forecast to plan your work." },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);


  if (loading || user) {
    return (
     <div className="flex h-screen items-center justify-center bg-background/0">
       <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
     </div>
   );
 }

  return (
    <div className="flex flex-col min-h-screen text-foreground">
      <header className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Logo />
          <Button asChild variant="ghost">
            <Link href="/auth">Sign In</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative flex items-center justify-center h-screen overflow-hidden">
          <motion.div
            className="relative z-10 text-center text-white px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 tracking-tight">
              Welcome to AgroLens AI
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-foreground/80">
              Revolutionizing agriculture with the power of AI. Your digital partner for a healthier, more productive farm.
            </p>
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/auth">
                Get Started <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </motion.div>
        </section>

        <section id="features" className="py-20 bg-secondary/50">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">Intelligent Farming at Your Fingertips</h2>
              <p className="text-lg text-muted-foreground mt-2 max-w-3xl mx-auto">
                Leverage cutting-edge technology to monitor, diagnose, and enhance your crop yield.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.5 }}
                  variants={featureVariants}
                >
                  <CardSpotlight 
                    color="hsl(var(--muted) / 0.1)"
                    className="p-6 flex flex-col items-center text-center transition-all duration-300 h-full">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                      <feature.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-headline font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardSpotlight>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-background/0">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AgroLens AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
