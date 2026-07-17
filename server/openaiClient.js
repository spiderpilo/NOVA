import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set. Create a .env file — see .env.example.');
  process.exit(1);
}

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
