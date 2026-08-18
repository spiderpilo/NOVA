import { NotebookPen, Stethoscope } from 'lucide-react'
import './LoginScreen.css'
import { listTeamMembers } from '../lib/teamStore'
import type { TeamMember } from '../lib/types'

interface Props {
  onLogin: (member: TeamMember) => void
}

// The app's only gate — picking a name here is what "logging in" means for
// this prototype (no passwords). It sets both role and team for the
// session, which is what scopes every patient list from this point on.
function LoginScreen({ onLogin }: Props) {
  const members = listTeamMembers()
  const providers = members.filter((m) => m.role === 'provider')
  const scribesFor = (providerId: string) => members.filter((m) => m.role === 'scribe' && m.supervisorId === providerId)

  return (
    <div className="login-screen">
      <div className="login-screen-content">
        <h1>Who&rsquo;s charting today?</h1>
        <p className="login-screen-subtitle">Pick your name to load your team&rsquo;s patients.</p>

        <div className="login-screen-list">
          {providers.map((provider) => (
            <div key={provider.id} className="login-team-card">
              <button type="button" className="login-member-row login-member-row-provider" onClick={() => onLogin(provider)}>
                <Stethoscope size={16} className="login-member-icon" />
                <span className="login-member-name">{provider.name}</span>
                <span className="login-member-role">Provider</span>
              </button>
              {scribesFor(provider.id).map((scribe) => (
                <button type="button" key={scribe.id} className="login-member-row" onClick={() => onLogin(scribe)}>
                  <NotebookPen size={15} className="login-member-icon" />
                  <span className="login-member-name">{scribe.name}</span>
                  <span className="login-member-role">Scribe</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoginScreen
