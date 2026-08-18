import { NotebookPen, Stethoscope, UserPlus } from 'lucide-react'
import { useState } from 'react'
import './TeamScreen.css'
import { addTeamMember, listTeamMembers } from '../lib/teamStore'
import type { CurrentUser, TeamMember } from '../lib/types'

interface Props {
  currentUser: CurrentUser
}

// Scoped to the signed-in user's own team — a scribe sees their provider
// and teammates, a provider sees themselves and their scribes, never the
// rest of the practice's teams. Inviting always adds a scribe to this same
// team, since there's no "other team" to assign one to from here.
function TeamScreen({ currentUser }: Props) {
  const [members, setMembers] = useState<TeamMember[]>(() => listTeamMembers())
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')

  const provider = members.find((m) => m.id === currentUser.teamId)
  const scribes = members.filter((m) => m.role === 'scribe' && m.supervisorId === currentUser.teamId)

  function handleInvite() {
    const trimmed = name.trim()
    if (!trimmed) return
    addTeamMember(trimmed, 'scribe', currentUser.teamId)
    setMembers(listTeamMembers())
    setName('')
    setFormOpen(false)
  }

  function handleCancel() {
    setFormOpen(false)
    setName('')
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
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleInvite()
            }}
            placeholder="Full name"
          />
          <p className="team-invite-note">Joins as a scribe on {provider.name}&rsquo;s team.</p>
          <div className="team-invite-actions">
            <button type="button" className="btn btn-sm" onClick={handleCancel}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={handleInvite} disabled={!name.trim()}>
              Send Invite
            </button>
          </div>
        </div>
      )}

      <div className="team-list">
        <div className="team-provider-card">
          <div className="team-provider-header">
            <Stethoscope size={18} className="team-provider-icon" />
            <span className="team-provider-name">{provider.name}</span>
            {provider.id === currentUser.id && <span className="team-you-badge">You</span>}
            <span className="team-role-badge">Provider</span>
          </div>
          <div className="team-scribes-list">
            {scribes.length === 0 ? (
              <p className="team-empty-note">No scribes assigned yet.</p>
            ) : (
              scribes.map((scribe) => (
                <div key={scribe.id} className="team-scribe-row">
                  <NotebookPen size={15} className="team-scribe-icon" />
                  <span>{scribe.name}</span>
                  {scribe.id === currentUser.id && <span className="team-you-badge">You</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamScreen
