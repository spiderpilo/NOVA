import { BookOpen, ChevronDown, Home, LogIn, LogOut, MessageCircle, NotebookPen, Stethoscope, Upload, UserCircle, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import './TaskBar.css'
import type { Role } from '../lib/types'

interface Props {
  onHome: () => void
  onOpenUploadTool: () => void
  onSelectRole: (role: Role) => void
}

// Instructions/Chat/Team are visual shell only for now — no onClick handlers
// yet. This is a layout pass to get placement approved before they're wired
// up to real features or new pages. Home, Upload, and the Provider/Scribe
// picker under Profile are the pieces with real behavior already.
function TaskBar({ onHome, onOpenUploadTool, onSelectRole }: Props) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profileOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileOpen])

  function handlePickRole(role: Role) {
    setProfileOpen(false)
    onSelectRole(role)
  }

  return (
    <div className="task-bar">
      <button type="button" className="task-bar-button" onClick={onHome}>
        <Home size={17} />
        Home
      </button>
      <button type="button" className="task-bar-button">
        <BookOpen size={17} />
        Instructions
      </button>
      <button type="button" className="task-bar-button">
        <MessageCircle size={17} />
        Chat
      </button>
      <button type="button" className="task-bar-button">
        <Users size={17} />
        Team
      </button>
      <button type="button" className="task-bar-button" onClick={onOpenUploadTool}>
        <Upload size={17} />
        Upload
      </button>
      <div className="task-bar-dropdown" ref={profileRef}>
        <button type="button" className="task-bar-button" onClick={() => setProfileOpen((open) => !open)}>
          <UserCircle size={17} />
          Profile
          <ChevronDown size={14} />
        </button>
        {profileOpen && (
          <div className="task-bar-dropdown-menu">
            <button type="button" className="task-bar-dropdown-item" onClick={() => handlePickRole('provider')}>
              <Stethoscope size={16} />
              Provider
            </button>
            <button type="button" className="task-bar-dropdown-item" onClick={() => handlePickRole('scribe')}>
              <NotebookPen size={16} />
              Scribe
            </button>
          </div>
        )}
      </div>
      <button type="button" className="task-bar-button" onClick={() => setSignedIn((s) => !s)}>
        {signedIn ? <LogOut size={17} /> : <LogIn size={17} />}
        {signedIn ? 'Sign Out' : 'Sign In'}
      </button>
    </div>
  )
}

export default TaskBar
