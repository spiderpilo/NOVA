import { Router } from 'express';
import { createUser, findUserByEmail, listUsers } from '../userStore.js';

const router = Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET / -> the full roster, used by the Team page and by the sign-up
// form's "which provider are you scribing for" dropdown.
router.get('/', async (req, res) => {
  res.json(await listUsers());
});

// POST /signup { name, email, role, supervisorId? } -> creates and returns
// the new account. No password yet — email is just the unique identifier.
router.post('/signup', async (req, res) => {
  const { name, email, role, supervisorId } = req.body ?? {};

  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }
  if (role !== 'provider' && role !== 'scribe') {
    return res.status(400).json({ error: 'Role must be "provider" or "scribe".' });
  }

  const trimmedEmail = email.trim();

  if (role === 'scribe') {
    if (typeof supervisorId !== 'string' || supervisorId.length === 0) {
      return res.status(400).json({ error: 'Scribes must select a supervising provider.' });
    }
    const users = await listUsers();
    const supervisor = users.find((u) => u.id === supervisorId && u.role === 'provider');
    if (!supervisor) {
      return res.status(400).json({ error: 'Selected provider was not found.' });
    }
  }

  if (await findUserByEmail(trimmedEmail)) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const user = await createUser({
    name: name.trim(),
    email: trimmedEmail,
    role,
    supervisorId: role === 'scribe' ? supervisorId : null,
  });
  res.status(201).json(user);
});

// POST /signin { email } -> the matching account, or 404. Passwordless for
// now — see the privacy/compliance note in README.md.
router.post('/signin', async (req, res) => {
  const { email } = req.body ?? {};

  if (typeof email !== 'string' || email.trim().length === 0) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const user = await findUserByEmail(email.trim());
  if (!user) {
    return res.status(404).json({ error: 'No account found with that email.' });
  }

  res.json(user);
});

export default router;
