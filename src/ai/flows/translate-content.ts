'use server';

/**
 * @fileOverview Translates structured JSON content from one language to another.
 *
 * - translateContent - A function that handles the translation.
 */

import { ai } from '@/ai/genkit';
import { TranslateContentInputSchema, TranslateContentOutputSchema, type TranslateContentInput, type TranslateContentOutput } from './translate-content-types';

export async function translateContent(input: TranslateContentInput): Promise<TranslateContentOutput> {
  return translateContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateContentPrompt',
  input: { schema: TranslateContentInputSchema },
  output: { schema: TranslateContentOutputSchema },
  prompt: `Translate all user-facing text values in the following JSON object to {{targetLanguage}}. Maintain the original JSON structure and key names exactly.

  JSON to translate:
  {{{JSONstringify content}}}
  `,
  model: 'googleai/gemini-2.5-flash-lite',
  config: {
      temperature: 0.2 // Lower temperature for more deterministic translation
  }
});

const translateContentFlow = ai.defineFlow(
  {
    name: 'translateContentFlow',
    inputSchema: TranslateContentInputSchema,
    outputSchema: TranslateContentOutputSchema,
  },
  async (input) => {

    const handlebars = await import('handlebars');
    handlebars.registerHelper('JSONstringify', function(context) {
        return JSON.stringify(context, null, 2);
    });
      
    const { output } = await prompt(input);
    return output!;
  }
);
