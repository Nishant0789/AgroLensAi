import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Default AI instance using the main API key
export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
});

// AI instance specifically for the Crop Scanner
export const scannerAi = genkit({
  plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY_SCANNER || process.env.GEMINI_API_KEY})],
});

// AI instance specifically for the Chatbot
export const chatAi = genkit({
    plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY_CHAT || process.env.GEMINI_API_KEY})],
});

// AI instance for the Guide and other generated content
export const guideAi = genkit({
    plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY_GUIDE || process.env.GEMINI_API_KEY})],
});
