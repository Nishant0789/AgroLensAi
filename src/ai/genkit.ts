'use server';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// This instance is for interactive, low-latency tasks like chatbots.
// It might use a faster, less powerful model.
export const interactiveAi = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY_PRIMARY})],
});

// This instance is for complex, generative tasks like creating detailed guides.
// It might use a more powerful, but slower model.
export const generativeAi = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY_SECONDARY})],
});

// AI instance for all other AI tasks.
export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
});
