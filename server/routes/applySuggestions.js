import { Router } from 'express';
import { openai } from '../openaiClient.js';

const router = Router();

const SYSTEM_PROMPT = `You are a clinical writing assistant updating an existing PM&R progress note by adding physician-selected plan items.

You will be given the note as it currently stands, plus a list of suggestions the physician has reviewed and selected to add.

Add these to the most appropriate existing section — typically the plan — phrased as the physician's own directive plan, not as a hedged suggestion. The selected items are written as recommendations for review ("Consider..."); once the physician has selected one, it becomes something they're documenting as their actual plan, so state it directly.

Examples:
- "Consider referring to OT for ADL training" -> "Refer to OT for ADL training."
- "Consider starting melatonin 3mg PO nightly for reported difficulty sleeping." -> "Start melatonin 3mg PO nightly for reported difficulty sleeping."
- "Consider increasing gabapentin from 300mg to 600mg TID given persistent pain despite the current dose." -> "Increase gabapentin from 300mg to 600mg TID given persistent pain despite the current dose."

Critical rules:
- Never write "consider," "suggest," "may want to," "possibly," "recommend considering," or any other hedging phrase in the note. Every added item must read as a direct action, order, or documented finding — not a proposal.
- Do NOT rephrase, restructure, or reword any part of the note that isn't directly affected by these additions. Preserve the exact existing wording everywhere else, character for character.
- Only add the selected items below — do not add anything not in the list, and do not invent additional clinical information beyond what each item states.
- Keep the markdown headings, horizontal rules, and formatting exactly as in the current note.
- Output only the updated note — no commentary before or after.`;

// Request:  { noteText: string, suggestions: string[] }
// Response: { updatedNote: string } | { error: string }
router.post('/', async (req, res) => {
  const { noteText, suggestions } = req.body ?? {};

  if (typeof noteText !== 'string' || noteText.trim().length === 0) {
    return res.status(400).json({ error: 'No note text provided.' });
  }

  const validSuggestions =
    Array.isArray(suggestions) && suggestions.length > 0 && suggestions.every((s) => typeof s === 'string' && s.trim().length > 0);

  if (!validSuggestions) {
    return res.status(400).json({ error: 'No suggestions selected.' });
  }

  try {
    const suggestionList = suggestions.map((s) => `- ${s}`).join('\n');

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Current note:\n\n${noteText}\n\n---\n\nSelected suggestions to add:\n${suggestionList}`,
        },
      ],
    });

    const updatedNote = completion.choices[0]?.message?.content?.trim();

    if (!updatedNote) {
      return res.status(502).json({ error: 'Received an empty response from the model.' });
    }

    res.json({ updatedNote });
  } catch (err) {
    console.error('apply-suggestions error:', err.status, err.message);
    res.status(err.status || 500).json({ error: 'Failed to apply suggestions. Please try again.' });
  }
});

export default router;
