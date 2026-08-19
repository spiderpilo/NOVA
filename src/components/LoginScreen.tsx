import { useEffect, useState } from 'react'
import './LoginScreen.css'
import { ApiError, fetchTeamRoster, signIn, signUp } from '../lib/apiClient'
import type { Role, TeamMember } from '../lib/types'

interface Props {
  onLogin: (member: TeamMember) => void
}

type Mode = 'signIn' | 'signUp'

// The app's only gate — a real (if still passwordless) account, fetched
// from the backend (see server/routes/team.js). Signing in loads an
// existing account by email; signing up creates one and picks a role, plus
// which provider a scribe works under.
function LoginScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<Mode>('signIn')
  const [providers, setProviders] = useState<TeamMember[]>([])
  const [rosterError, setRosterError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('scribe')
  const [supervisorId, setSupervisorId] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTeamRoster()
      .then((roster) => setProviders(roster.filter((m) => m.role === 'provider')))
      .catch((err) => setRosterError(err instanceof ApiError ? err.message : 'Failed to load the team roster.'))
  }, [])

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
    if (role === 'scribe' && !supervisorId) return
    setSubmitting(true)
    setError(null)
    try {
      const member = await signUp({
        name: trimmedName,
        email: trimmedEmail,
        role,
        supervisorId: role === 'scribe' ? supervisorId : null,
      })
      onLogin(member)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to sign up.')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmitSignIn = email.trim().length > 0
  const canSubmitSignUp = name.trim().length > 0 && email.trim().length > 0 && (role === 'provider' || supervisorId !== '')

  return (
    <div className="login-screen">
      <div className="login-screen-content">
        <h1>{mode === 'signIn' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="login-screen-subtitle">
          {mode === 'signIn' ? 'Sign in to load your team’s patients.' : 'Sign up to join or start a team.'}
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

          {mode === 'signUp' && (
            <>
              <div className="login-mode-toggle">
                <button
                  type="button"
                  className={role === 'provider' ? 'login-mode-option login-mode-option-active' : 'login-mode-option'}
                  onClick={() => setRole('provider')}
                >
                  Provider
                </button>
                <button
                  type="button"
                  className={role === 'scribe' ? 'login-mode-option login-mode-option-active' : 'login-mode-option'}
                  onClick={() => setRole('scribe')}
                >
                  Scribe
                </button>
              </div>

              {role === 'scribe' &&
                (providers.length > 0 ? (
                  <select value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
                    <option value="">Which provider do you work with?</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="login-form-note">
                    {rosterError ?? 'No providers have signed up yet — a provider needs to sign up first.'}
                  </p>
                ))}
            </>
          )}

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
      </div>
    </div>
  )
}

export default LoginScreen
