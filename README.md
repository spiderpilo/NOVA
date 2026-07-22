# Note Observation & Validation Assistant

Import a patient progress-notes PDF, extract its text client-side, and get a
version reworded into a standard PM&R progress note format via GPT. An AI
chat then interviews the clinician to fill in gaps in the patient's
functional/rehab profile, and an AI suggestions panel proposes reviewable
additions (referrals, medications, equipment, follow-up) — the clinician
selects what to add, and it lands in the note as their own direct plan,
never as invented clinical fact.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `OPENAI_API_KEY` (get one at
     [platform.openai.com/api-keys](https://platform.openai.com/api-keys)).
   - `AUTH_USER` / `AUTH_PASSWORD` — required; the API server refuses to
     start without both. Generate a strong password, e.g.
     `openssl rand -base64 18`.
3. `npm run gen-cert` — generates a self-signed TLS cert into `certs/`
   (gitignored) so both dev servers can run over HTTPS. Your browser will
   warn that the cert isn't trusted; that's expected for a local dev cert.
4. `npm run dev:all` — starts the Vite dev server (`:5173`) and the API
   server (`:3001`) together, both over HTTPS. The browser will prompt for
   the `AUTH_USER` / `AUTH_PASSWORD` credentials on first API call.

## How it works

- PDF text extraction runs entirely in the browser via `pdf.js` — no OCR
  service, no cost, and the raw PDF file never leaves the browser. Only
  text-based PDFs are supported; scanned/image-only PDFs will show an error.
- The extracted text is sent to a small Express backend (`/server`), which
  calls the OpenAI API to reword it into the PM&R progress note structure
  defined in `server/progressNoteSkeleton.js`. The API key lives only in the
  server's `.env` and is never exposed to the browser.
- In parallel, the extracted text is scanned locally (in the browser, no API
  call, no cost) with a fixed keyword check per required section (subjective,
  PMH, social/family history, allergies, medications, exam, labs,
  assessment/plan). Any section whose usual header/keywords aren't found is
  flagged as worth a second look — a heuristic warning, not a claim that
  content is actually missing.
- **AI Chat** (`server/routes/chat.js`) interviews the clinician one question
  at a time to fill in gaps, prioritizing a PM&R-specific patient profile —
  current rehab services (PT/OT/speech frequency and progress), assistive
  devices, functional status, prior level of function, living situation,
  patient goals, pain's functional impact, safety, and discharge planning —
  before falling back to generic section gaps, and skipping anything already
  documented. A Skip button is available for questions the clinician can't
  answer. Each answer updates the note in place via
  `server/routes/updateNote.js`, instructed to touch only the section the
  answer affects and preserve everything else character-for-character, so
  the diff highlight below stays precise instead of showing incidental AI
  rephrasing.
- **AI Suggestions** (`server/routes/suggestions.js`) proactively generates
  categorized, physician-reviewable suggestions — referrals, medications,
  equipment, safety, follow-up, documentation — from the note and the
  original source text. Medication suggestions can name a specific drug and
  dose for a symptom clearly stated in the note (e.g. reported trouble
  sleeping → melatonin), with guardrails: always cross-checked against the
  note's documented allergies, never a specific dose for controlled
  substances/anticoagulants/insulin (a generic "reassess" instead), and a
  persistent on-screen reminder to verify against interactions and
  renal/hepatic function before prescribing. The clinician selects which
  suggestions to add; `server/routes/applySuggestions.js` adds only the
  selected ones, rephrased as the clinician's own direct plan — never hedged
  language like "consider."
- The Reworded Output panel shows what changed after each chat answer or
  applied suggestion as an editable, highlighted diff — new content is
  highlighted in green, and you can type directly into it without losing the
  highlighting. A "Clear highlights" button drops back to a plain editable
  view.
- The API server requires HTTP Basic Auth on every request (`server/authMiddleware.js`)
  and writes an access-only audit trail to `server/logs/audit.log`
  (`server/auditLog.js`) — timestamp, method, path, status, user, IP. The
  audit log never contains note text or model output, only who accessed the
  endpoint and when.
- Both dev servers run over HTTPS using a locally generated self-signed cert
  (`certs/`, gitignored — regenerate with `npm run gen-cert`).

## Deploying to Vercel

**Only use synthetic/mock patient data on a deployment until the OpenAI BAA
is signed and zero data retention is confirmed** — see the compliance note
below. Vercel itself can be made HIPAA-eligible (BAA available on Pro/
Enterprise), but that's a separate step from the OpenAI BAA, and neither is
in place by default.

The API is structured to run both as a local long-running process
(`server/index.js`, used by `npm run dev:server`) and as a Vercel serverless
function (`api/index.js`) — both just wrap the same Express app defined in
`server/app.js`. `vercel.json` rewrites all `/api/*` requests to that
function.

To deploy: connect this repo in Vercel (or `vercel --prod` if using the
CLI), then set these under Project Settings → Environment Variables —
**the app will fail on cold start if any required one is missing**:

- `OPENAI_API_KEY` — required.
- `AUTH_USER` / `AUTH_PASSWORD` — required. HTTP Basic Auth is still enforced
  on a deployed instance; don't skip this just because it's "only for
  employees to try."
- `OPENAI_MODEL` — optional, defaults to `gpt-4o-mini`.

Note that `certs/` (the local self-signed TLS cert) is irrelevant on
Vercel — Vercel terminates HTTPS itself, so `api/index.js` never touches
that cert-loading logic at all. Also, the audit log writes to `console.log`
instead of a local file when deployed (`server/auditLog.js` detects the
`VERCEL` env var Vercel sets automatically) — view it under your Vercel
project's Function Logs, since a serverless function's local filesystem
isn't persistent between invocations.

## Privacy / compliance note

This app sends extracted patient note text to OpenAI's API — for rewording,
the chat interview, and generating/applying suggestions. Before using this
with real patient data in any regulated context, you still need, at minimum:

- **A signed Business Associate Agreement (BAA) with OpenAI**, with zero data
  retention enabled on your account. This is a legal/procurement step handled
  directly with OpenAI — nothing in this codebase can satisfy it, and no PHI
  should go through this app until it's in place.
- **A real TLS certificate** for any non-localhost deployment — the
  self-signed cert here is for local development only and will not be
  trusted by browsers or valid for a real domain.
- **A proper credential/secrets story** — `AUTH_USER`/`AUTH_PASSWORD` here is
  a single shared login suitable for one local user, not a multi-user
  account system. It has no session expiry, no lockout after failed
  attempts, no per-user audit identity, and the password lives in plaintext
  in `.env`.
- **Administrative safeguards** required by the HIPAA Security Rule that are
  entirely outside of code: a documented risk analysis, workforce training,
  breach notification procedures, and a retention/disposal policy.

The app itself never logs extracted text or model output (only the access
metadata described above), and does not persist note content anywhere beyond
browser memory for the current session.

## Scope

Not supported in this version: scanned/image PDFs (no OCR), streaming
responses, persistence, multi-user accounts.
