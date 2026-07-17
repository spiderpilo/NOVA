import { app } from '../server/app.js';

// Vercel's Node.js runtime treats a default-exported Express app as a
// request handler — no .listen() call, Vercel owns the actual serving.
export default app;
