import { NotebookPen, Stethoscope, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import './TeamScreen.css'
import { ApiError, fetchTeamRoster, signUp } from '../lib/apiClient'
import type { CurrentUser, TeamMember } from '../lib/types'

interface Props {
  currentUser: CurrentUser
}

// Scoped to the signed-in user's own team — a scribe sees their provider
// and teammates, a provider sees themselves and their scribes, never the
// rest of the practice's teams. Inviting always adds a scribe to this same
// team, since there's no "other team" to assign one to from here. Behind
// the scenes this is the same account creation as signing up (see
// LoginScreen) — the invited person could sign in with that email later.
function TeamScreen({ currentUser }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  function loadRoster() {
    fetchTeamRoster()
      .then(setMembers)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Failed to load the team.'))
  }

  useEffect(loadRoster, [])

  const provider = members.find((m) => m.id === currentUser.teamId)
  const scribes = members.filter((m) => m.role === 'scribe' && m.supervisorId === currentUser.teamId)

  async function handleInvite() {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName || !trimmedEmail) return
    setSubmitting(true)
    setInviteError(null)
    try {
      await signUp({ name: trimmedName, email: trimmedEmail, role: 'scribe', supervisorId: currentUser.teamId })
      loadRoster()
      setName('')
      setEmail('')
      setFormOpen(false)
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : 'Failed to add team member.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    setFormOpen(false)
    setName('')
    setEmail('')
    setInviteError(null)
  }

  if (loadError) {
    return (
      <div className="team-screen">
        <p className="team-empty-note">{loadError}</p>
      </div>
    )
  }

  if (!provider) return null

  return (
    <div className="team-screen">
      <div className="team-screen-header">
        <h1>Team</h1>
        <button type="button" className="btn btn-sm" onClick={() => setFormOpen((open) => !open)}>
          <UserPlus size={15} />
          Invite team member
        </button>
      </div>

      {formOpen && (
        <div className="team-invite-form">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleInvite()
            }}
            placeholder="Email"
          />
          <p className="team-invite-note">Joins as a scribe on {provider.name}&rsquo;s team.</p>
          {inviteError && <p className="team-invite-error">{inviteError}</p>}
          <div className="team-invite-actions">
            <button type="button" className="btn btn-sm" onClick={handleCancel}>
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => void handleInvite()}
              disabled={submitting || !name.trim() || !email.trim()}
            >
              {submitting ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </div>
      )}

      <div className="team-list">
        <div className="team-section-card">
          <h2 className="team-section-heading">Provider</h2>
          <div className="team-provider-row">
            <Stethoscope size={18} className="team-provider-icon" />
            <span className="team-provider-name">{provider.name}</span>
            {provider.id === currentUser.id && <span className="team-you-badge">You</span>}
          </div>
        </div>

        <div className="team-section-card">
          <h2 className="team-section-heading">Scribes</h2>
          {scribes.length === 0 ? (
            <p className="team-empty-note">No scribes assigned yet.</p>
          ) : (
            <div className="team-scribes-list">
              {scribes.map((scribe) => (
                <div key={scribe.id} className="team-scribe-row">
                  <NotebookPen size={15} className="team-scribe-icon" />
                  <span>{scribe.name}</span>
                  {scribe.id === currentUser.id && <span className="team-you-badge">You</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeamScreen
