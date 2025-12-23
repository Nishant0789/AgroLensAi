'use server';

/**
 * @fileOverview Translates structured JSON content from one language to another.
 *
 * - translateContent - A function that handles the translation.
 * - TranslateContentInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const TranslateContentInputSchema = z.object({
  content: z.any().describe('The JSON object with text fields to be translated.'),
  targetLanguage: z.string().describe('The target language (e.g., "English", "Hindi").'),
});
export type TranslateContentInput = z.infer<typeof TranslateContentInputSchema>;

export const TranslateContentOutputSchema = z.any();
export type TranslateContentOutput = z.infer<typeof TranslateContentOutputSchema>;


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
