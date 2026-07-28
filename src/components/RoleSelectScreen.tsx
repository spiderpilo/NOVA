import './RoleSelectScreen.css'
import orcaLogo from '../assets/orca-logo.png'
import type { Role } from '../lib/types'

interface Props {
  onSelect: (role: Role) => void
}

function RoleSelectScreen({ onSelect }: Props) {
  return (
    <div className="role-select-screen">
      <div className="role-select-content">
        <div className="role-select-brand">
          <img src={orcaLogo} alt="Orca Rehab NOVA" className="role-select-logo" />
        </div>
        <div className="role-select-intro">
          <h1>Select User</h1>
          <p>This determines which AI tool you'll see alongside the note.</p>
        </div>
        <div className="role-select-options">
          <button type="button" className="role-select-card" onClick={() => onSelect('provider')}>
            <h2>Provider</h2>
            <p>
              Review the reworded note and approve AI-suggested additions — referrals, medications, equipment, and
              follow-up items.
            </p>
          </button>
          <button type="button" className="role-select-card" onClick={() => onSelect('scribe')}>
            <h2>Scribe</h2>
            <p>Use the guided AI interview to fill in the note by answering questions about the patient.</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoleSelectScreen
