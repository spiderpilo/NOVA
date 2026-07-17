import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rewordRouter from './routes/reword.js';
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
