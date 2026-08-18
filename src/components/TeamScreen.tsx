import { NotebookPen, Stethoscope, UserPlus } from 'lucide-react'
import { useState } from 'react'
import './TeamScreen.css'
import { addTeamMember, listTeamMembers } from '../lib/teamStore'
import type { Role, TeamMember } from '../lib/types'

function TeamScreen() {
  const [members, setMembers] = useState<TeamMember[]>(() => listTeamMembers())
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('scribe')
  const [supervisorId, setSupervisorId] = useState('')

  const providers = members.filter((m) => m.role === 'provider')
  const scribesFor = (providerId: string) => members.filter((m) => m.role === 'scribe' && m.supervisorId === providerId)

  const canSubmit = name.trim().length > 0 && (role === 'provider' || supervisorId !== '')

  function handleInvite() {
    if (!canSubmit) return
    addTeamMember(name.trim(), role, role === 'scribe' ? supervisorId : null)
    setMembers(listTeamMembers())
    setName('')
    setRole('scribe')
    setSupervisorId('')
    setFormOpen(false)
  }

  function handleCancel() {
    setFormOpen(false)
    setName('')
    setRole('scribe')
    setSupervisorId('')
  }

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
            placeholder="Full name"
          />
          <div className="team-invite-role-toggle">
            <button
              type="button"
              className={role === 'provider' ? 'team-role-option team-role-option-active' : 'team-role-option'}
              onClick={() => setRole('provider')}
            >
              Provider
            </button>
            <button
              type="button"
              className={role === 'scribe' ? 'team-role-option team-role-option-active' : 'team-role-option'}
              onClick={() => setRole('scribe')}
            >
              Scribe
            </button>
          </div>
          {role === 'scribe' &&
            (providers.length > 0 ? (
              <select value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
                <option value="">Assign to provider…</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="team-invite-note">Invite a provider first before adding scribes.</p>
            ))}
          <div className="team-invite-actions">
            <button type="button" className="btn btn-sm" onClick={handleCancel}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={handleInvite} disabled={!canSubmit}>
              Send Invite
            </button>
          </div>
        </div>
      )}

      <div className="team-list">
        {providers.map((provider) => (
          <div key={provider.id} className="team-provider-card">
            <div className="team-provider-header">
              <Stethoscope size={18} className="team-provider-icon" />
              <span className="team-provider-name">{provider.name}</span>
              <span className="team-role-badge">Provider</span>
            </div>
            <div className="team-scribes-list">
              {scribesFor(provider.id).length === 0 ? (
                <p className="team-empty-note">No scribes assigned yet.</p>
              ) : (
                scribesFor(provider.id).map((scribe) => (
                  <div key={scribe.id} className="team-scribe-row">
                    <NotebookPen size={15} className="team-scribe-icon" />
                    <span>{scribe.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TeamScreen
