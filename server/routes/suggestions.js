import { Router } from 'express';
import { openai } from '../openaiClient.js';

const router = Router();

const SYSTEM_PROMPT = `You are a clinical documentation assistant for a physical medicine and rehabilitation (PM&R) practice, reviewing a progress note to suggest additional plan items a physician may want to consider — referrals, medication considerations, equipment/safety needs, and follow-up items.

You will be given the note as it currently stands, and the original unstructured source note it was built from, for context.

Suggest specific, actionable items the physician might want to add to the plan, such as:
- Referrals (OT, PT, speech therapy, pain management, orthopedics, etc.)
- Medication considerations (e.g. reconciliation needed, refill due) — you are flagging something worth the physician's attention, not prescribing or changing medications yourself
- Durable medical equipment or safety considerations (e.g. fall risk assessment, home safety evaluation, assistive device)
- Follow-up or monitoring recommendations
- Documentation gaps worth addressing

Critical rules:
- These are suggestions FOR THE PHYSICIAN TO REVIEW AND DECIDE ON — phrase each as a recommendation ("Consider referring to OT for ADL training"), never as a statement of fact about the patient.
- Do not invent clinical findings, diagnoses, or patient history not present in the note. Base each suggestion on what's actually documented, as a general clinical consideration — not on invented specifics.
- Keep each suggestion to one short, specific sentence.
- Return between 3 and 8 suggestions. Do not pad with filler if fewer genuinely apply, and return fewer than 3 (even zero) if that's honestly all that's warranted.
- Respond with ONLY a JSON object of this exact shape, no other text:
{"suggestions": [{"text": string, "category": string}]}
category must be one of: "Referral", "Medications", "Equipment", "Safety", "Follow-up", "Documentation".`;

// Request:  { noteText: string, originalText: string }
// Response: { suggestions: { text: string, category: string }[] } | { error: string }
router.post('/', async (req, res) => {
  const { noteText, originalText } = req.body ?? {};

  if (typeof noteText !== 'string' || noteText.trim().length === 0) {
    return res.status(400).json({ error: 'No note text provided.' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Current note:\n\n${noteText}\n\n---\n\nOriginal source note (for context):\n\n${typeof originalText === 'string' ? originalText : ''}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    const parsed = raw ? JSON.parse(raw) : null;

    const valid =
      parsed &&
      Array.isArray(parsed.suggestions) &&
      parsed.suggestions.every((s) => s && typeof s.text === 'string' && typeof s.category === 'string');

    if (!valid) {
      return res.status(502).json({ error: 'Received an unexpected response from the model.' });
    }

    res.json({ suggestions: parsed.suggestions });
  } catch (err) {
    console.error('suggestions error:', err.status, err.message);
    res.status(err.status || 500).json({ error: 'Failed to generate suggestions. Please try again.' });
  }
});

export default router;
