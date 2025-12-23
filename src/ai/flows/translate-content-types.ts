import { z } from 'genkit';

export const TranslateContentInputSchema = z.object({
  content: z.any().describe('The JSON object with text fields to be translated.'),
  targetLanguage: z.string().describe('The target language (e.g., "English", "Hindi").'),
});
export type TranslateContentInput = z.infer<typeof TranslateContentInputSchema>;

export const TranslateContentOutputSchema = z.any();
export type TranslateContentOutput = z.infer<typeof TranslateContentOutputSchema>;
