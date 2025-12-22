'use server';

/**
 * @fileOverview A flow to manage geo-location alerts for disease outbreaks.
 *
 * - alertNearbyDiseases - A function that triggers alerts for nearby disease outbreaks.
 * - GeoLocationAlertsInput - The input type for the alertNearbyDiseases function, including location coordinates.
 * - GeoLocationAlertsOutput - The return type for the alertNearbyDiseases function, confirming alert processing.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeoLocationAlertsInputSchema = z.object({
  latitude: z.number().describe('The latitude of the current scan.'),
  longitude: z.number().describe('The longitude of the current scan.'),
  disease: z.string().describe('The identified disease.'),
});
export type GeoLocationAlertsInput = z.infer<typeof GeoLocationAlertsInputSchema>;

const GeoLocationAlertsOutputSchema = z.object({
  message: z.string().describe('Confirmation message that alerts have been processed.'),
});
export type GeoLocationAlertsOutput = z.infer<typeof GeoLocationAlertsOutputSchema>;

export async function alertNearbyDiseases(input: GeoLocationAlertsInput): Promise<GeoLocationAlertsOutput> {
  return geoLocationAlertsFlow(input);
}

const geoLocationAlertsFlow = ai.defineFlow(
  {
    name: 'geoLocationAlertsFlow',
    inputSchema: GeoLocationAlertsInputSchema,
    outputSchema: GeoLocationAlertsOutputSchema,
  },
  async input => {
    // Logic to store the disease location and trigger nearby alerts would be implemented here.
    // This is a placeholder for the actual implementation.

    //In a real implementation, this function would:
    // 1. Store the geo-location of the reported disease in Firestore using GeoHashing.
    // 2. Query Firestore for nearby locations within a 5km radius.
    // 3. Send alerts to users within that radius.

    // For now, just return a confirmation message.
    return {message: `Alerts processed for disease ${input.disease} at location (${input.latitude}, ${input.longitude}).`};
  }
);
