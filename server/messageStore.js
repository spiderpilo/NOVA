import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// See userStore.js for why this redirects to /tmp on Vercel — same
// read-only-filesystem issue, same caveat that it's a stopgap against
// hard-erroring, not durable storage there.
const isServerless = Boolean(process.env.VERCEL);
const DATA_DIR = isServerless ? '/tmp/nova-data' : path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'teamMessages.json');

// A JSON file, same test-run stand-in pattern as userStore.js — not a real
// database, fine for one long-running process.
async function persist(messages) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

let messagesPromise = null;

async function load() {
  if (messagesPromise) return messagesPromise;
  messagesPromise = (async () => {
    try {
      const raw = await readFile(MESSAGES_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      return [];
    }
  })();
  return messagesPromise;
}

// Every message belongs to exactly one team — Team Chat is scoped so only
// people on the same team (a provider and their scribes) see each other's
// messages, same as patients and the Team page.
export async function listMessagesForTeam(teamId) {
  const messages = await load();
  return messages.filter((m) => m.teamId === teamId).sort((a, b) => a.createdAt - b.createdAt);
}

export async function createMessage({ teamId, author, text }) {
  const messages = await load();
  const message = {
    id: crypto.randomUUID(),
    teamId,
    author,
    text,
    createdAt: Date.now(),
  };
  const next = [...messages, message];
  messagesPromise = Promise.resolve(next);
  await persist(next);
  return message;
}
