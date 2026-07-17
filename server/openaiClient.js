import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set. Create a .env file (see .env.example) or, when deployed, set it in your hosting provider\'s environment variables.');
}

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
