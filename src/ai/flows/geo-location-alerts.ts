'use server';

/**
 * @fileOverview A flow to manage geo-location alerts for disease outbreaks.
 *
 * - alertNearbyDiseases - A function that triggers alerts for nearby disease outbreaks.
 * - GeoLocationAlertsInput - The input type for the alertNearbyDiseases function.
 * - GeoLocationAlertsOutput - The return type for the alertNearbyDiseases function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, doc, setDoc, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { generatePreventiveMeasures } from './generate-preventive-measures';

const GeoLocationAlertsInputSchema = z.object({
  latitude: z.number().describe('The latitude of the current scan.'),
  longitude: z.number().describe('The longitude of the current scan.'),
  disease: z.string().describe('The identified disease.'),
  sourceUserId: z.string().describe('The ID of the user who reported the disease.'),
});
export type GeoLocationAlertsInput = z.infer<typeof GeoLocationAlertsInputSchema>;

const GeoLocationAlertsOutputSchema = z.object({
  message: z.string().describe('Confirmation message that alerts have been processed.'),
});
export type GeoLocationAlertsOutput = z.infer<typeof GeoLocationAlertsOutputSchema>;


// Haversine formula to calculate distance between two lat/lon points
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// This function is not a flow, so we don't define it with ai.defineFlow
// It's a server action that will be called from the client.
export async function alertNearbyDiseases(input: GeoLocationAlertsInput): Promise<GeoLocationAlertsOutput> {
    const { firestore } = initializeFirebase(); // This is ok now because we are not in a flow
    const { latitude, longitude, disease, sourceUserId } = input;
    
    // 1. Store the new disease alert
    const alertRef = await addDoc(collection(firestore, 'alerts'), {
        disease,
        latitude,
        longitude,
        sourceUserId,
        timestamp: serverTimestamp()
    });

    // 2. Find nearby users
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    const nearbyUsers = [];
    const ALERT_RADIUS_KM = 5;

    for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        if (user.uid !== sourceUserId && user.latitude && user.longitude) {
            const distance = getDistance(latitude, longitude, user.latitude, user.longitude);
            if (distance <= ALERT_RADIUS_KM) {
                nearbyUsers.push({ ...user, id: userDoc.id, distance });
            }
        }
    }

    // 3. For each nearby user, generate personalized preventive measures and create a notification
    for (const nearbyUser of nearbyUsers) {
        if (!nearbyUser.currentCrop) continue; // Skip if user has no crop set

        const measures = await generatePreventiveMeasures({
            disease,
            crop: nearbyUser.currentCrop,
            location: `${nearbyUser.city}, ${nearbyUser.country}` // Assuming user profile has this
        });

        const notification = {
            alertId: alertRef.id,
            disease,
            distance: nearbyUser.distance,
            preventiveMeasures: measures.measures,
            timestamp: serverTimestamp(),
            read: false
        };

        await addDoc(collection(firestore, `users/${nearbyUser.id}/notifications`), notification);
    }
    
    return {message: `Alerts processed for ${nearbyUsers.length} nearby users.`};
}