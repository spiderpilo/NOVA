import { Router } from 'express';
import { openai } from '../openaiClient.js';

const router = Router();

const SYSTEM_PROMPT = `You are a clinical documentation assistant for a physical medicine and rehabilitation (PM&R) practice, reviewing a progress note to suggest additional plan items a physician may want to consider — referrals, medication considerations, equipment/safety needs, and follow-up items.

You will be given the note as it currently stands, and the original unstructured source note it was built from, for context.

Suggest specific, actionable items the physician might want to add to the plan, such as:
- Referrals (OT, PT, speech therapy, pain management, orthopedics, etc.)
- Medications — see detailed rules below
- Durable medical equipment or safety considerations (e.g. fall risk assessment, home safety evaluation, assistive device)
- Follow-up or monitoring recommendations
- Documentation gaps worth addressing

Medication suggestions — be specific, but stay within these bounds:
- If the note clearly states a symptom with a well-established, low-risk first-line medication (e.g. reported trouble sleeping → melatonin; mild constipation → a stool softener), name that specific medication and its typical starting dose, e.g. "Consider starting melatonin 3mg PO nightly for reported difficulty sleeping."
- If an existing documented medication appears under-dosed for a symptom the note clearly states is persisting (e.g. pain not improving on a low dose), you may suggest a specific dose adjustment, e.g. "Consider increasing gabapentin from 300mg to 600mg TID given persistent pain despite the current dose."
- Always check the note's Allergies section first — never suggest a medication or drug class the patient is documented as allergic to.
- Never suggest starting, stopping, or changing the dose of a controlled substance, opioid, anticoagulant (e.g. warfarin), insulin, or other narrow-therapeutic-index medication. For those, only suggest that the physician "review" or "reassess" the current regimen — no specific drug or dose.
- Never suggest a medication or dose change tied to a symptom that isn't actually stated in the note — do not infer or invent symptoms to justify a suggestion.

Other critical rules:
- These are suggestions FOR THE PHYSICIAN TO REVIEW AND DECIDE ON — phrase each as a recommendation ("Consider referring to OT for ADL training," "Consider starting..."), never as a statement of fact about the patient or an instruction already carried out.
- Do not invent clinical findings, diagnoses, or patient history not present in the note. Base each suggestion on what's actually documented.
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
