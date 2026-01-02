'use server';

/**
 * @fileOverview A chatbot AI agent for answering general farming questions.
 *
 * - agroConsultantChatbot - A function that handles the chatbot interaction.
 * - AgroConsultantChatbotInput - The input type for the agroConsultantChatbot function AgroConsultantChatbotInput - The input type for the agroConsultantChatbot function..
 * - AgroConsultantChatbotOutput - The return type for the agroConsultantChatbot function.
 */

// import {interactiveAi} from '@/ai/genkit';
import {z} from 'zod';
import Handlebars from 'handlebars';

// Handlebars helper function to check equality
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    // @ts-ignore
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});


const AgroConsultantChatbotInputSchema = z.object({
  query: z.string().describe('The farming question asked by the user.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('The chat history between the user and the assistant.'),
});

export type AgroConsultantChatbotInput = z.infer<typeof AgroConsultantChatbotInputSchema>;

const AgroConsultantChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user query.'),
});

export type AgroConsultantChatbotOutput = z.infer<typeof AgroConsultantChatbotOutputSchema>;

export async function agroConsultantChatbot(input: AgroConsultantChatbotInput): Promise<AgroConsultantChatbotOutput> {
  // return agroConsultantChatbotFlow(input);
  console.log('agroConsultantChatbot called, but AI is disabled');
  return { response: 'This is a mock response. AI functionality is temporarily disabled.' };
}

// const prompt = interactiveAi.definePrompt({
//   name: 'agroConsultantChatbotPrompt',
//   input: {schema: AgroConsultantChatbotInputSchema},
//   output: {schema: AgroConsultantChatbotOutputSchema},
//   prompt: `You are a helpful AI assistant that specializes in answering farming questions. Use the chat history to maintain context.

// Chat History:
// {{#each chatHistory}}
//   {{#ifEquals role "user"}}User: {{content}}{{else}}Assistant: {{content}}{{/ifEquals}}
// {{/each}}

// User Query: {{{query}}}

// Response: `,
//   model: 'googleai/gemini-2.5-flash-lite',
//   config: {
//     safetySettings: [
//       {
//         category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
//         threshold: 'BLOCK_NONE',
//       },
//     ],
//   },
// });

// const agroConsultantChatbotFlow = interactiveAi.defineFlow(
//   {
//     name: 'agroConsultantChatbotFlow',
//     inputSchema: AgroConsultantChatbotInputSchema,
//     outputSchema: AgroConsultantChatbotOutputSchema,
//   },
//   async input => {
//     const {output} = await prompt(input);
//     return {
//       response: output!.response,
//     };
//   }
// );
