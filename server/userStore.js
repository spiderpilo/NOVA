import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// A JSON file rather than a database — this is a test-run stand-in, same
// spirit as the audit log, not a real accounts store. Fine for one
// long-running process; not built for concurrent writers.
async function persist(users) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// Mirrors the mock roster the app shipped with before accounts moved
// server-side, so a fresh test run doesn't start with an empty team.
function seedUsers() {
  const patelId = crypto.randomUUID();
  const bellId = crypto.randomUUID();
  return [
    { id: patelId, name: 'Dr. Sarah Patel', email: 'sarah.patel@orcarehab.test', role: 'provider', supervisorId: null },
    { id: bellId, name: 'Dr. Marcus Bell', email: 'marcus.bell@orcarehab.test', role: 'provider', supervisorId: null },
    { id: crypto.randomUUID(), name: 'Alex Kim', email: 'alex.kim@orcarehab.test', role: 'scribe', supervisorId: patelId },
    { id: crypto.randomUUID(), name: 'Jordan Lee', email: 'jordan.lee@orcarehab.test', role: 'scribe', supervisorId: patelId },
    { id: crypto.randomUUID(), name: 'Taylor Nguyen', email: 'taylor.nguyen@orcarehab.test', role: 'scribe', supervisorId: bellId },
  ];
}

// Cached as a promise (not the resolved value) so concurrent early callers
// all await the same load/seed instead of racing to seed the file twice.
let usersPromise = null;

async function load() {
  if (usersPromise) return usersPromise;
  usersPromise = (async () => {
    try {
      const raw = await readFile(USERS_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      const seeded = seedUsers();
      await persist(seeded);
      return seeded;
    }
  })();
  return usersPromise;
}

export async function listUsers() {
  return load();
}

export async function findUserByEmail(email) {
  const users = await load();
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalized) ?? null;
}

export async function createUser({ name, email, role, supervisorId }) {
  const users = await load();
  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    role,
    supervisorId: role === 'scribe' ? supervisorId : null,
  };
  const next = [...users, user];
  usersPromise = Promise.resolve(next);
  await persist(next);
  return user;
}
