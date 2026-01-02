'use server';
// import {genkit} from '@genkit-ai/core';
// import {googleAI} from '@genkit-ai/google-genai';

// This instance is for interactive, low-latency tasks like chatbots.
// It might use a faster, less powerful model.
// export const interactiveAi = genkit({
//   plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY_PRIMARY})],
// });
export const interactiveAi: any = {};
if (typeof Proxy !== 'undefined') {
  const handler = {
    get: function(target: any, prop: any, receiver: any) {
      if (prop === 'defineFlow' || prop === 'definePrompt') {
        return () => () => Promise.resolve({ output: {} });
      }
      return () => Promise.resolve({ output: {} });
    }
  };
  module.exports.interactiveAi = new Proxy({}, handler);
}


// This instance is for complex, generative tasks like creating detailed guides.
// It might use a more powerful, but slower model.
// export const generativeAi = genkit({
//   plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY_SECONDARY})],
// });
export const generativeAi: any = {};
if (typeof Proxy !== 'undefined') {
  const handler = {
    get: function(target: any, prop: any, receiver: any) {
      if (prop === 'defineFlow' || prop === 'definePrompt') {
        return () => () => Promise.resolve({ output: {} });
      }
      return () => Promise.resolve({ output: {} });
    }
  };
  module.exports.generativeAi = new Proxy({}, handler);
}


// AI instance for all other AI tasks.
// export const ai = genkit({
//   plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
// });
export const ai: any = {};
if (typeof Proxy !== 'undefined') {
  const handler = {
    get: function(target: any, prop: any, receiver: any) {
      if (prop === 'defineFlow' || prop === 'definePrompt') {
        return () => () => Promise.resolve({ output: {} });
      }
      return () => Promise.resolve({ output: {} });
    }
  };
  module.exports.ai = new Proxy({}, handler);
}
