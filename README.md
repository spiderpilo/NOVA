# Progress Note Rewording App

Import a patient progress-notes PDF, extract its text client-side, and get a
version reworded into a standard PM&R progress note format via GPT — plus a
check for whether anything important looks missing.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in `OPENAI_API_KEY` (get one at
   [platform.openai.com/api-keys](https://platform.openai.com/api-keys)).
3. `npm run dev:all` — starts the Vite dev server (`:5173`) and the API
   server (`:3001`) together.

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

## Privacy note

This app sends extracted patient note text to OpenAI's API for rewording and
the completeness check. Review OpenAI's API data-handling and retention terms
before using this with real patient data in any regulated context — this
project does not implement HIPAA-level compliance controls (no encryption at
rest, no audit logging, no BAA). The app itself never logs extracted text or
model output, and does not persist any of it beyond browser memory for the
current session.

## Scope

Not supported in this version: scanned/image PDFs (no OCR), streaming
responses, persistence, authentication.
