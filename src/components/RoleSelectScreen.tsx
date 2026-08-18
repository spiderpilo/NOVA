import { CalendarDays, CircleCheck, CloudUpload, FilePlus2, FileSignature, Users } from 'lucide-react'
import './RoleSelectScreen.css'
import orcaVideo from '../assets/orca-vid.mp4'
import { formatDateLabel } from '../lib/dateUtils'
import { listPatients, listRoundingDates } from '../lib/patientStore'

interface Props {
  onOpenAllPatients: () => void
  onOpenAwaitingSignature: () => void
  onOpenNeedsUpload: () => void
  onOpenNoNoteYet: () => void
  onOpenRoundingDate: (date: string) => void
}

// Temporarily just a placeholder plus a patient summary — there's no
// explicit role picker anymore, Provider/Scribe gets set automatically by
// whichever entry point you use to reach a patient. The rest of this page
// (branding, intro copy) will come back once it's redesigned around the
// new TaskBar.
function RoleSelectScreen({
  onOpenAllPatients,
  onOpenAwaitingSignature,
  onOpenNeedsUpload,
  onOpenNoNoteYet,
  onOpenRoundingDate,
}: Props) {
  const patients = listPatients()
  const total = patients.length
  const awaitingSignature = patients.filter((p) => p.reworded && !p.signed).length
  const needsUpload = patients.filter((p) => p.signed && !p.uploaded).length
  const noNoteYet = patients.filter((p) => !p.reworded).length
  const roundingDates = listRoundingDates()
  const completeDates = roundingDates.filter((rd) => rd.complete === rd.total).length
  const inProgressDates = roundingDates.length - completeDates

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
          <button type="button" className="home-stat-tile home-stat-tile-interactive" onClick={onOpenNoNoteYet}>
            <FilePlus2 size={22} className="home-stat-icon" />
            <span className="home-stat-value">{noNoteYet}</span>
            <span className="home-stat-label">No note yet</span>
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
          <button
            type="button"
            className="home-stat-tile home-stat-tile-interactive home-stat-tile-warning"
            onClick={onOpenNeedsUpload}
          >
            <CloudUpload size={22} className="home-stat-icon" />
            <span className="home-stat-value">{needsUpload}</span>
            <span className="home-stat-label">Need to be uploaded</span>
          </button>
        </div>

        {roundingDates.length > 0 && (
          <div className="rounding-dates-card">
            <h2 className="rounding-dates-heading">
              <CalendarDays size={18} />
              Rounding Dates
            </h2>
            <div className="rounding-dates-summary">
              <div className="rounding-dates-summary-item">
                <span className="rounding-dates-summary-value">{roundingDates.length}</span>
                <span className="rounding-dates-summary-label">Rounding dates</span>
              </div>
              <div className="rounding-dates-summary-item rounding-dates-summary-item-complete">
                <span className="rounding-dates-summary-value">{completeDates}</span>
                <span className="rounding-dates-summary-label">Complete</span>
              </div>
              <div className="rounding-dates-summary-item rounding-dates-summary-item-pending">
                <span className="rounding-dates-summary-value">{inProgressDates}</span>
                <span className="rounding-dates-summary-label">In progress</span>
              </div>
            </div>
            <ul className="rounding-dates-list">
              {roundingDates.map((rd) => {
                const isComplete = rd.complete === rd.total
                return (
                  <li key={rd.date}>
                    <button type="button" className="rounding-date-item" onClick={() => onOpenRoundingDate(rd.date)}>
                      <span className="rounding-date-label">{formatDateLabel(rd.date)}</span>
                      <span
                        className={isComplete ? 'rounding-date-status rounding-date-status-complete' : 'rounding-date-status'}
                      >
                        {isComplete ? (
                          <>
                            <CircleCheck size={15} />
                            Complete
                          </>
                        ) : (
                          `${rd.complete}/${rd.total} complete`
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <p className="role-select-placeholder">Select a patient above, or from the Patients screen, to get started.</p>
      </div>
    </div>
  )
}

export default RoleSelectScreen
