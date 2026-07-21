import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rewordRouter from './routes/reword.js';
import chatRouter from './routes/chat.js';
import updateNoteRouter from './routes/updateNote.js';
import suggestionsRouter from './routes/suggestions.js';
import applySuggestionsRouter from './routes/applySuggestions.js';
import { basicAuth } from './authMiddleware.js';
import { auditLog } from './auditLog.js';

// The Express app itself, with no listener attached — shared between the
// local dev server (server/index.js) and the Vercel serverless entry
// (api/index.js), which each handle running/serving it differently.
export const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(auditLog);
app.use(basicAuth);

app.use('/api/reword', rewordRouter);
app.use('/api/chat', chatRouter);
app.use('/api/update-note', updateNoteRouter);
app.use('/api/suggestions', suggestionsRouter);
app.use('/api/apply-suggestions', applySuggestionsRouter);
