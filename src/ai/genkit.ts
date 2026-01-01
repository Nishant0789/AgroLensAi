import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// AI instance for frequent, interactive tasks like scanning and chatting.
export const interactiveAi = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY_PRIMARY || process.env.GEMINI_API_KEY})],
});

// AI instance for less frequent, heavy generative tasks like guides and timelines.
export const generativeAi = genkit({
    plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY_SECONDARY || process.env.GEMINI_API_KEY})],
});

// Fallback/Default AI instance
export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
});
