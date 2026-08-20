import { Router } from 'express';
import { createMessage, listMessagesForTeam } from '../messageStore.js';

const router = Router();

// GET ?teamId=... -> that team's messages, oldest first.
router.get('/', async (req, res) => {
  const { teamId } = req.query;

  if (typeof teamId !== 'string' || teamId.length === 0) {
    return res.status(400).json({ error: 'teamId is required.' });
  }

  res.json(await listMessagesForTeam(teamId));
});

// POST { teamId, author, text } -> creates and returns the message.
router.post('/', async (req, res) => {
  const { teamId, author, text } = req.body ?? {};

  if (typeof teamId !== 'string' || teamId.length === 0) {
    return res.status(400).json({ error: 'teamId is required.' });
  }
  if (typeof author !== 'string' || author.trim().length === 0) {
    return res.status(400).json({ error: 'author is required.' });
  }
  if (typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required.' });
  }

  const message = await createMessage({ teamId, author: author.trim(), text: text.trim() });
  res.status(201).json(message);
});

export default router;
