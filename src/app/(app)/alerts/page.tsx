'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { mockAlerts } from '@/lib/mock-data';
import { Bell, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AlertsPage() {
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
        {mockAlerts.length > 0 ? (
          mockAlerts.map((alert) => (
            <motion.div key={alert.id} variants={FADE_IN_ITEM}>
              <Card className="glass-card hover:shadow-lg transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-destructive/10 rounded-full">
                      <Bell className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-destructive">{alert.disease}</h3>
                      <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{alert.distance}km away</span>
                        </div>
                        <span>&bull;</span>
                        <span>{alert.date}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">View Details</Button>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <motion.div variants={FADE_IN_ITEM}>
             <Card className="glass-card">
                 <CardContent className="p-10 text-center text-muted-foreground">
                    <Bell className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="font-semibold">All Clear!</h3>
                    <p>No nearby disease alerts at the moment.</p>
                 </CardContent>
             </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
