'use server';

/**
 * @fileOverview Translates structured JSON content from one language to another.
 *
 * - translateContent - A function that handles the translation.
 */

// import { interactiveAi } from '@/ai/genkit';
import {
  TranslateContentInputSchema,
  TranslateContentOutputSchema,
  type TranslateContentInput,
  type TranslateContentOutput,
} from './translate-content-types';
import { z } from 'zod';


// New schema to define the structure for batch translation
const TranslationRequestSchema = z.object({
  strings: z.array(z.string()).describe('An array of strings to be translated.'),
});

const TranslationResponseSchema = z.object({
  translations: z.array(z.string()).describe('The translated strings, in the same order as the input.'),
});


// Helper function to recursively find all string values in a JSON object
function findStrings(obj: any, strings: string[] = []) {
  if (typeof obj === 'string') {
    strings.push(obj);
  } else if (Array.isArray(obj)) {
    obj.forEach(item => findStrings(item, strings));
  } else if (typeof obj === 'object' && obj !== null) {
    Object.values(obj).forEach(value => findStrings(value, strings));
  }
  return strings;
}

// Helper function to recursively replace original strings with translated ones
function replaceStrings(obj: any, translations: string[]): any {
  if (typeof obj === 'string') {
    return translations.shift() || obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => replaceStrings(item, translations));
  }
  if (typeof obj === 'object' && obj !== null) {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      newObj[key] = replaceStrings(obj[key], translations);
    }
    return newObj;
  }
  return obj;
}


export async function translateContent(input: TranslateContentInput): Promise<TranslateContentOutput> {
  // return translateContentFlow(input);
  console.log('translateContent called, but AI is disabled.');
  return input.content;
}


// const translateContentFlow = interactiveAi.defineFlow(
//   {
//     name: 'translateContentFlow',
//     inputSchema: TranslateContentInputSchema,
//     outputSchema: TranslateContentOutputSchema,
//   },
//   async ({ content, targetLanguage }) => {
//     // 1. Find all strings to translate
//     const stringsToTranslate = findStrings(JSON.parse(JSON.stringify(content))); // Deep copy to avoid mutation issues
    
//     if (stringsToTranslate.length === 0) {
//       return content;
//     }

//     // 2. Call the LLM to translate them in a batch
//     const translationResult = await interactiveAi.generate({
//       prompt: `Translate the following array of strings into ${targetLanguage}. Maintain the array structure and the order of the strings.

//       Strings to translate:
//       ${JSON.stringify(stringsToTranslate, null, 2)}
//       `,
//       model: 'googleai/gemini-2.5-flash-lite',
//       output: {
//         schema: TranslationResponseSchema,
//       },
//       config: {
//         temperature: 0.2, // Lower temperature for more deterministic translation
//       },
//     });

//     const translatedStrings = translationResult.output?.translations;

//     if (!translatedStrings || translatedStrings.length !== stringsToTranslate.length) {
//       throw new Error('Translation failed: The number of translated strings does not match the original.');
//     }

//     // 3. Reconstruct the object with the translated strings
//     const translatedContent = replaceStrings(JSON.parse(JSON.stringify(content)), translatedStrings);

//     return translatedContent;
//   }
// );
