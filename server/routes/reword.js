import { Router } from 'express';
import { openai } from '../openaiClient.js';
import { PROGRESS_NOTE_SKELETON } from '../progressNoteSkeleton.js';

const router = Router();

const SYSTEM_PROMPT = `You are a clinical writing assistant. You will be given raw patient progress note text. Reorganize and reword it to follow this exact note structure and formatting:

${PROGRESS_NOTE_SKELETON}

Rules:
- Preserve all clinical facts, measurements, medication names/dosages, vitals, and dates exactly as given. Do not invent information.
- Fill each section using information found in the source text. If a section has no corresponding information in the source text, write "Not documented" under that heading instead of leaving it blank or inventing content.
- Keep the markdown headings, horizontal rules, and bullet/heading formatting from the structure above.
- Do not add commentary before or after the note.`;

// Request:  { text: string }
// Response: { reworded: string } | { error: string }
router.post('/', async (req, res) => {
  const { text } = req.body ?? {};

  if (typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'No text provided to reword.' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
    });

    const reworded = completion.choices[0]?.message?.content?.trim();

    if (!reworded) {
      return res.status(502).json({ error: 'Received an empty response from the model.' });
    }

    res.json({ reworded });
  } catch (err) {
    console.error('reword error:', err.status, err.message);
    res.status(err.status || 500).json({ error: 'Failed to reword text. Please try again.' });
  }
});

export default router;
