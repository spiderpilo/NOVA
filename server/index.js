import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { existsSync, readFileSync } from 'node:fs';
import { createServer as createHttpsServer } from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rewordRouter from './routes/reword.js';
import { basicAuth } from './authMiddleware.js';
import { auditLog } from './auditLog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_PATH = path.join(__dirname, '..', 'certs', 'key.pem');
const CERT_PATH = path.join(__dirname, '..', 'certs', 'cert.pem');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(auditLog);
app.use(basicAuth);

app.use('/api/reword', rewordRouter);

const port = process.env.PORT || 3001;

if (existsSync(KEY_PATH) && existsSync(CERT_PATH)) {
  const options = { key: readFileSync(KEY_PATH), cert: readFileSync(CERT_PATH) };
  createHttpsServer(options, app).listen(port, () => {
    console.log(`API server listening on https://localhost:${port}`);
  });
} else {
  console.warn('No TLS cert found in certs/ — run `npm run gen-cert` for HTTPS. Falling back to plain HTTP (PHI should never traverse this in production without TLS).');
  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}
