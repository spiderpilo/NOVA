import './TaskBar.css'
import orcaLogo from '../assets/orca-logo.png'

interface Props {
  onOpenUploadTool: () => void
}

// Instructions/Chat/Team/Profile are visual shell only for now — no onClick
// handlers yet. This is a layout pass to get placement approved before
// they're wired up to real features or new pages. Upload Tool is the one
// exception since it already exists as a real screen.
function TaskBar({ onOpenUploadTool }: Props) {
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
        <button type="button" className="btn btn-sm" onClick={onOpenUploadTool}>
          Upload
        </button>
        <button type="button" className="btn btn-sm">
          Profile
        </button>
      </div>
    </div>
  )
}

export default TaskBar
