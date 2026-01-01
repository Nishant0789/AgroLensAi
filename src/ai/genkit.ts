'use server';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// AI instance for all AI tasks.
export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
});
