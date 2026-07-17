import { existsSync, readFileSync } from 'node:fs';
import { createServer as createHttpsServer } from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_PATH = path.join(__dirname, '..', 'certs', 'key.pem');
const CERT_PATH = path.join(__dirname, '..', 'certs', 'cert.pem');

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
