import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'audit.log');

const logDirReady = mkdir(LOG_DIR, { recursive: true });

// Records who accessed which endpoint, when, and whether it succeeded —
// never the request or response body, since that's where PHI (the note
// text) lives. This is an access trail, not a content log.
export function auditLog(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const entry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      user: req.authUser ?? null,
      ip: req.ip,
      durationMs: Date.now() - start,
    };

    logDirReady
      .then(() => appendFile(LOG_FILE, JSON.stringify(entry) + '\n'))
      .catch((err) => console.error('audit log write failed:', err.message));
  });

  next();
}
