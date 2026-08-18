import './RoleSelectScreen.css'
import type { Role } from '../lib/types'

interface Props {
  onSelect: (role: Role) => void
}

// Temporarily stripped down to just the two role cards — branding, intro
// copy, and other sections will come back once the rest of the page
// (around the new TaskBar) is redesigned.
function RoleSelectScreen({ onSelect }: Props) {
  return (
    <div className="role-select-screen">
      <div className="role-select-content">
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
