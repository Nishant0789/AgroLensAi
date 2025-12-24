'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, MapPin, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth.tsx';
import { useCollection, useFirestore } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CardSpotlight } from '@/components/ui/card-spotlight';

type Notification = {
  id: string;
  disease: string;
  distance: number;
  preventiveMeasures: string;
  timestamp: {
    seconds: number;
    nanoseconds: number;
  }
}

export default function AlertsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const notificationsQuery = user ? query(collection(firestore, `users/${user.uid}/notifications`), orderBy('timestamp', 'desc')) : null;
  const { data: notifications, loading } = useCollection<Notification>(notificationsQuery);

  const FADE_IN_LIST = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const FADE_IN_ITEM = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const formatDate = (timestamp: {seconds: number, nanoseconds: number}) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold font-headline">Nearby Disease Alerts</h1>
        <p className="text-muted-foreground mt-2">Stay informed about potential threats in your area.</p>
      </motion.div>

      <motion.div
        className="space-y-4"
        variants={FADE_IN_LIST}
        initial="hidden"
        animate="visible"
      >
        {loading && (
            <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Checking for alerts...</p>
            </div>
        )}
        {!loading && notifications && notifications.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
            {notifications.map((alert) => (
                <motion.div key={alert.id} variants={FADE_IN_ITEM}>
                    <AccordionItem value={alert.id} className="border-none">
                        <CardSpotlight className="mb-4 p-0">
                            <AccordionTrigger className="p-4 w-full cursor-pointer [&[data-state=open]>svg]:text-primary">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-destructive/10 rounded-full">
                                        <Bell className="h-6 w-6 text-destructive" />
                                        </div>
                                        <div>
                                        <h3 className="font-semibold text-destructive text-left">{alert.disease}</h3>
                                        <div className="flex items-center text-sm text-muted-foreground gap-2">
                                            <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            <span>{alert.distance.toFixed(1)}km away</span>
                                            </div>
                                            <span>&bull;</span>
                                            <span>{formatDate(alert.timestamp)}</span>
                                        </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="hidden md:flex">View Details</Button>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="p-4 pt-0">
                                    <h4 className="font-semibold flex items-center mb-2"><Info className="mr-2 h-4 w-4 text-primary"/>Personalized Prevention Plan</h4>
                                    <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md whitespace-pre-line">{alert.preventiveMeasures}</p>
                                </div>
                            </AccordionContent>
                        </CardSpotlight>
                    </AccordionItem>
                </motion.div>
            ))}
          </Accordion>
        ) : (
          !loading && <motion.div variants={FADE_IN_ITEM}>
             <CardSpotlight>
                 <CardContent className="p-10 text-center text-muted-foreground">
                    <Bell className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="font-semibold">All Clear!</h3>
                    <p>No nearby disease alerts at the moment.</p>
                 </CardContent>
             </CardSpotlight>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
