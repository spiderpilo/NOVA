import { FilePlus2, FileSignature, Users } from 'lucide-react'
import './RoleSelectScreen.css'
import orcaVideo from '../assets/orca-vid.mp4'
import { listPatients } from '../lib/patientStore'

interface Props {
  onOpenAllPatients: () => void
  onOpenAwaitingSignature: () => void
  onOpenNoNoteYet: () => void
}

// Temporarily just a placeholder plus a patient summary — there's no
// explicit role picker anymore, Provider/Scribe gets set automatically by
// whichever entry point you use to reach a patient. The rest of this page
// (branding, intro copy) will come back once it's redesigned around the
// new TaskBar.
function RoleSelectScreen({ onOpenAllPatients, onOpenAwaitingSignature, onOpenNoNoteYet }: Props) {
  const patients = listPatients()
  const total = patients.length
  const awaitingSignature = patients.filter((p) => p.reworded && !p.signed).length
  const noNoteYet = patients.filter((p) => !p.reworded).length

  return (
    <div className="role-select-screen">
      <div className="role-select-content">
        <div className="role-select-video-card">
          <video className="role-select-video" src={orcaVideo} autoPlay loop muted playsInline />
        </div>
        <div className="home-stats">
          <button type="button" className="home-stat-tile home-stat-tile-interactive" onClick={onOpenAllPatients}>
            <Users size={22} className="home-stat-icon" />
            <span className="home-stat-value">{total}</span>
            <span className="home-stat-label">Total patients</span>
          </button>
          <button
            type="button"
            className="home-stat-tile home-stat-tile-interactive home-stat-tile-warning"
            onClick={onOpenAwaitingSignature}
          >
            <FileSignature size={22} className="home-stat-icon" />
            <span className="home-stat-value">{awaitingSignature}</span>
            <span className="home-stat-label">Awaiting provider signature</span>
          </button>
          <button type="button" className="home-stat-tile home-stat-tile-interactive" onClick={onOpenNoNoteYet}>
            <FilePlus2 size={22} className="home-stat-icon" />
            <span className="home-stat-value">{noNoteYet}</span>
            <span className="home-stat-label">No note yet</span>
          </button>
        </div>
        <p className="role-select-placeholder">Select a patient above, or from the Patients screen, to get started.</p>
      </div>
    </div>
  )
}

export default RoleSelectScreen
