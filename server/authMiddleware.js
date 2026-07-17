import crypto from 'node:crypto';

const AUTH_USER = process.env.AUTH_USER;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;

if (!AUTH_USER || !AUTH_PASSWORD) {
  console.error('AUTH_USER / AUTH_PASSWORD is not set. Create a .env file — see .env.example.');
  process.exit(1);
}

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Protects every route it's mounted on with HTTP Basic Auth. This is a
// single-user tool — there's no account system, credentials live only in
// .env, and the browser's native auth prompt handles the login UI.
export function basicAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, encoded] = header.split(' ');

  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    const user = decoded.slice(0, sep);
    const password = decoded.slice(sep + 1);

    if (safeEqual(user, AUTH_USER) && safeEqual(password, AUTH_PASSWORD)) {
      req.authUser = user;
      return next();
    }
  }

  res.set('WWW-Authenticate', 'Basic realm="NOVA", charset="UTF-8"');
  res.status(401).json({ error: 'Authentication required.' });
}
