import './RoleSelectScreen.css'
import orcaVideo from '../assets/orca-vid.mp4'
import { listPatients } from '../lib/patientStore'

// Temporarily just a placeholder plus a patient summary — Provider/Scribe
// selection moved into the TaskBar's Profile dropdown, so there's nothing
// left to pick here. The rest of this page (branding, intro copy) will come
// back once it's redesigned around the new TaskBar.
function RoleSelectScreen() {
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
          <div className="home-stat-tile">
            <span className="home-stat-value">{total}</span>
            <span className="home-stat-label">Total patients</span>
          </div>
          <div className="home-stat-tile home-stat-tile-warning">
            <span className="home-stat-value">{awaitingSignature}</span>
            <span className="home-stat-label">Awaiting provider signature</span>
          </div>
          <div className="home-stat-tile">
            <span className="home-stat-value">{noNoteYet}</span>
            <span className="home-stat-label">No note yet</span>
          </div>
        </div>
        <p className="role-select-placeholder">Use the Profile menu above to continue as Provider or Scribe.</p>
      </div>
    </div>
  )
}

export default RoleSelectScreen
