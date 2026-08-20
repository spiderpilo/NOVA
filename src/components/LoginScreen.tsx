import { useState } from 'react'
import './LoginScreen.css'
import { ApiError, signIn, signUp } from '../lib/apiClient'
import { seedDemoPatientsIfEmpty } from '../lib/mockPatients'
import { resolveTeamId } from '../lib/team'
import type { TeamMember } from '../lib/types'

interface Props {
  onLogin: (member: TeamMember) => void
}

type Mode = 'signIn' | 'signUp'

// Must match server/userStore.js's DEMO_PROVIDER_EMAIL/DEMO_SCRIBE_EMAIL —
// fixed accounts ensured to exist on every server load specifically so
// these two buttons always work without anyone needing to sign up first.
const DEMO_PROVIDER_EMAIL = 'demo.provider@orcarehab.demo'
const DEMO_SCRIBE_EMAIL = 'demo.scribe@orcarehab.demo'

// The app's only gate — a real (if still passwordless) account, fetched
// from the backend (see server/routes/team.js). Signing in loads an
// existing account by email. Signing up always creates a Provider account
// (starting a new team) — Scribes don't self-serve sign up; a Provider
// adds them from the Team page instead, which creates their account too.
function LoginScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<Mode>('signIn')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  async function handleSignIn() {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return
    setSubmitting(true)
    setError(null)
    try {
      const member = await signIn(trimmedEmail)
      onLogin(member)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSignUp() {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName || !trimmedEmail) return
    setSubmitting(true)
    setError(null)
    try {
      const member = await signUp({ name: trimmedName, email: trimmedEmail, role: 'provider', supervisorId: null })
      onLogin(member)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to sign up.')
    } finally {
      setSubmitting(false)
    }
  }

  // Skips the form entirely — signs into a fixed demo account and makes
  // sure its team has the curated demo patients (seeded once, not
  // re-seeded on every click) before handing off. Same shared team either
  // way, since the Demo Scribe is supervised by the Demo Provider — the
  // two buttons are two viewpoints on one walk-through-able dataset.
  async function handleDemoLogin(demoEmail: string) {
    setSubmitting(true)
    setError(null)
    try {
      const member = await signIn(demoEmail)
      seedDemoPatientsIfEmpty(resolveTeamId(member))
      onLogin(member)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load the demo.')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmitSignIn = email.trim().length > 0
  const canSubmitSignUp = name.trim().length > 0 && email.trim().length > 0

  return (
    <div className="login-screen">
      <div className="login-screen-content">
        <h1>{mode === 'signIn' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="login-screen-subtitle">
          {mode === 'signIn'
            ? 'Sign in to load your team’s patients.'
            : 'Sign up as a provider to start your team — scribes join by invite from the Team page.'}
        </p>

        <div className="login-mode-toggle">
          <button
            type="button"
            className={mode === 'signIn' ? 'login-mode-option login-mode-option-active' : 'login-mode-option'}
            onClick={() => switchMode('signIn')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === 'signUp' ? 'login-mode-option login-mode-option-active' : 'login-mode-option'}
            onClick={() => switchMode('signUp')}
          >
            Sign Up
          </button>
        </div>

        <div className="login-form">
          {mode === 'signUp' && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              autoFocus
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void (mode === 'signIn' ? handleSignIn() : handleSignUp())
            }}
            placeholder="Email"
            autoFocus={mode === 'signIn'}
          />

          {error && <p className="login-form-error">{error}</p>}

          <button
            type="button"
            className="btn"
            onClick={() => void (mode === 'signIn' ? handleSignIn() : handleSignUp())}
            disabled={submitting || (mode === 'signIn' ? !canSubmitSignIn : !canSubmitSignUp)}
          >
            {submitting ? 'Please wait…' : mode === 'signIn' ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        <div className="login-demo">
          <div className="login-demo-divider">
            <span>or explore a demo</span>
          </div>
          <div className="login-demo-actions">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => void handleDemoLogin(DEMO_PROVIDER_EMAIL)}
              disabled={submitting}
            >
              View as Provider
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => void handleDemoLogin(DEMO_SCRIBE_EMAIL)}
              disabled={submitting}
            >
              View as Scribe
            </button>
          </div>
          <p className="login-demo-note">Both open the same walk-through patients, viewed from each role.</p>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen
