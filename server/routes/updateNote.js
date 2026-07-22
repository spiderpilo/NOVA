import { Router } from 'express';
import { openai } from '../openaiClient.js';

const router = Router();

const SYSTEM_PROMPT = `You are a clinical writing assistant updating an existing PM&R progress note with a single new piece of information gathered from a clinician interview.

You will be given the note as it currently stands, plus a question that was asked and the clinician's answer.

Update the note to incorporate this new information into the most appropriate section — typically replacing a "Not documented" placeholder, or adding to that section's existing content.

Critical rules:
- Do NOT rephrase, restructure, or reword any part of the note that isn't directly affected by this new information. Preserve the exact existing wording everywhere else, character for character.
- Only touch the section(s) relevant to this new information.
- Preserve all clinical facts, measurements, medication names/dosages, vitals, and dates exactly as they already appear elsewhere in the note.
- Do not invent, infer, or add any clinical information beyond what the answer states.
- Keep the markdown headings, horizontal rules, and formatting exactly as in the current note.
- Do not use markdown bold or italic (no "**text**" or "*text*") anywhere in the note — plain text only, aside from the "#"/"##" headings and "-" bullets already in the note's structure.
- Output only the updated note — no commentary before or after.`;

// Request:  { noteText: string, question: string, answer: string }
// Response: { updatedNote: string } | { error: string }
router.post('/', async (req, res) => {
  const { noteText, question, answer } = req.body ?? {};

  if (typeof noteText !== 'string' || noteText.trim().length === 0) {
    return res.status(400).json({ error: 'No note text provided.' });
  }
  if (typeof question !== 'string' || typeof answer !== 'string' || answer.trim().length === 0) {
    return res.status(400).json({ error: 'Missing question or answer.' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Current note:\n\n${noteText}\n\n---\n\nNew information gathered:\nQ: ${question}\nA: ${answer}`,
        },
      ],
    });

    const updatedNote = completion.choices[0]?.message?.content?.trim();

    if (!updatedNote) {
      return res.status(502).json({ error: 'Received an empty response from the model.' });
    }

    res.json({ updatedNote });
  } catch (err) {
    console.error('update-note error:', err.status, err.message);
    res.status(err.status || 500).json({ error: 'Failed to update the note. Please try again.' });
  }
});

export default router;
