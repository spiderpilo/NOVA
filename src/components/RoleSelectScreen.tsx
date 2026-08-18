import './RoleSelectScreen.css'

// Temporarily just a placeholder — Provider/Scribe selection moved into the
// TaskBar's Profile dropdown, so there's nothing left to pick here. The rest
// of this page (branding, intro copy) will come back once it's redesigned
// around the new TaskBar.
function RoleSelectScreen() {
  return (
    <div className="role-select-screen">
      <div className="role-select-content">
        <p className="role-select-placeholder">Use the Profile menu above to continue as Provider or Scribe.</p>
      </div>
    </div>
  )
}

export default RoleSelectScreen
