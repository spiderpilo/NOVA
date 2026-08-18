import { CalendarDays, CircleCheck, CloudUpload, FilePlus2, FileSignature, Users } from 'lucide-react'
import './RoleSelectScreen.css'
import orcaVideo from '../assets/orca-vid.mp4'
import { formatDateLabel } from '../lib/dateUtils'
import { listPatients, listRoundingDates } from '../lib/patientStore'

interface Props {
  teamId: string
  onOpenAllPatients: () => void
  onOpenAwaitingSignature: () => void
  onOpenNeedsUpload: () => void
  onOpenNoNoteYet: () => void
  onOpenRoundingDate: (date: string) => void
}

// The home dashboard, scoped to the signed-in user's own team — every
// figure here is that team's patients only, not the whole practice's.
function RoleSelectScreen({
  teamId,
  onOpenAllPatients,
  onOpenAwaitingSignature,
  onOpenNeedsUpload,
  onOpenNoNoteYet,
  onOpenRoundingDate,
}: Props) {
  const patients = listPatients(teamId)
  const total = patients.length
  const awaitingSignature = patients.filter((p) => p.reworded && !p.signed).length
  const needsUpload = patients.filter((p) => p.signed && !p.uploaded).length
  const noNoteYet = patients.filter((p) => !p.reworded).length
  const roundingDates = listRoundingDates(teamId)

  return (
    <div className="role-select-screen">
      <div className="role-select-content">
        <div className="role-select-video-card">
          <video className="role-select-video" src={orcaVideo} autoPlay loop muted playsInline />
        </div>

        <div className="home-main-grid">
          <div className="home-stats">
            <button type="button" className="stat-tile stat-tile-interactive" onClick={onOpenAllPatients}>
              <Users size={20} className="stat-tile-icon" />
              <span className="stat-tile-value">{total}</span>
              <span className="stat-tile-label">Total patients</span>
            </button>
            <button type="button" className="stat-tile stat-tile-interactive" onClick={onOpenNoNoteYet}>
              <FilePlus2 size={20} className="stat-tile-icon" />
              <span className="stat-tile-value">{noNoteYet}</span>
              <span className="stat-tile-label">No note yet</span>
            </button>
            <button
              type="button"
              className="stat-tile stat-tile-interactive stat-tile-warning"
              onClick={onOpenAwaitingSignature}
            >
              <FileSignature size={20} className="stat-tile-icon" />
              <span className="stat-tile-value">{awaitingSignature}</span>
              <span className="stat-tile-label">Awaiting provider signature</span>
            </button>
            <button
              type="button"
              className="stat-tile stat-tile-interactive stat-tile-warning"
              onClick={onOpenNeedsUpload}
            >
              <CloudUpload size={20} className="stat-tile-icon" />
              <span className="stat-tile-value">{needsUpload}</span>
              <span className="stat-tile-label">Need to be uploaded</span>
            </button>
          </div>

          {roundingDates.length > 0 && (
            <div className="rounding-dates-card">
              <h2 className="rounding-dates-heading">
                <CalendarDays size={18} />
                Rounding Dates
              </h2>
              <ul className="rounding-dates-list">
                {roundingDates.map((rd) => {
                  const isComplete = rd.complete === rd.total
                  return (
                    <li key={rd.date}>
                      <button type="button" className="rounding-date-item" onClick={() => onOpenRoundingDate(rd.date)}>
                        <div className="rounding-date-row">
                          <span className="rounding-date-label">{formatDateLabel(rd.date)}</span>
                          {isComplete && (
                            <span className="rounding-date-complete-badge">
                              <CircleCheck size={15} />
                              Complete
                            </span>
                          )}
                        </div>
                        <div className="rounding-date-counts">
                          <span>{rd.total} patients</span>
                          <span>{rd.complete} done</span>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        <p className="role-select-placeholder">Select a patient above, or from the Patients screen, to get started.</p>
      </div>
    </div>
  )
}

export default RoleSelectScreen
