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

const translateContentFlow = ai.defineFlow(
  {
    name: 'translateContentFlow',
    inputSchema: TranslateContentInputSchema,
    outputSchema: TranslateContentOutputSchema,
  },
  async ({ content, targetLanguage }) => {
    const contentString = JSON.stringify(content, null, 2);

    const { output } = await ai.generate({
        prompt: `Translate all user-facing text values in the following JSON object to ${targetLanguage}. Maintain the original JSON structure and key names exactly.

        JSON to translate:
        ${contentString}
        `,
        model: 'googleai/gemini-2.5-flash-lite',
        output: {
            schema: TranslateContentOutputSchema,
        },
        config: {
            temperature: 0.2 // Lower temperature for more deterministic translation
        }
    });

    return output!;
  }
);
