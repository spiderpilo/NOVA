import './TaskBar.css'
import orcaLogo from '../assets/orca-logo.png'

// Visual shell only for now — no onClick handlers yet. This is a layout
// pass to get placement approved before any of these are wired up to real
// features or new pages.
function TaskBar() {
  return (
    <div className="task-bar">
      <img src={orcaLogo} alt="Orca Rehab NOVA" className="task-bar-logo" />
      <div className="task-bar-actions">
        <button type="button" className="btn btn-sm">
          Instructions
        </button>
        <button type="button" className="btn btn-sm">
          Chat
        </button>
        <button type="button" className="btn btn-sm">
          Team
        </button>
        <button type="button" className="btn btn-sm">
          Profile
        </button>
      </div>
    </div>
  )
}

export default TaskBar
