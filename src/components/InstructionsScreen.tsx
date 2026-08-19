import {
  ClipboardList,
  FileSignature,
  Home,
  LogIn,
  MessageCircle,
  NotebookPen,
  Upload,
  Users,
} from 'lucide-react'
import './InstructionsScreen.css'

interface Section {
  icon: typeof LogIn
  title: string
  items: string[]
}

const SECTIONS: Section[] = [
  {
    icon: LogIn,
    title: 'Signing in',
    items: ['Pick your name from the list. This sets your role and loads your team’s patients.'],
  },
  {
    icon: Home,
    title: 'Home',
    items: [
      'Quick stats for your team: total patients, no note yet, awaiting signature, needs upload.',
      'Click a stat tile, or a rounding date, to jump straight to those patients.',
    ],
  },
  {
    icon: ClipboardList,
    title: 'Patients',
    items: [
      'Add a patient with their name, facility, and rounding date.',
      'Click a patient to open their note.',
      'Try "Add 15 mock patients" to explore the app with sample data.',
    ],
  },
  {
    icon: NotebookPen,
    title: 'Writing a note (Scribe)',
    items: [
      'Import the patient’s PDF — NOVA extracts the text and rewords it into a PM&R note automatically.',
      'Answer the AI Chat questions to fill in gaps in the patient’s profile, or Skip ones you can’t answer.',
      'Check the Completeness Check panel for any section worth a second look.',
    ],
  },
  {
    icon: FileSignature,
    title: 'Reviewing & signing (Provider)',
    items: [
      'Open a patient whose note is ready for review.',
      'Review AI Suggestions and add any you approve — they’re added as your own plan, never invented.',
      'Sign the note once it’s ready.',
    ],
  },
  {
    icon: Users,
    title: 'Team',
    items: ['See your provider and scribes.', 'Invite a new scribe to join your team.'],
  },
  {
    icon: MessageCircle,
    title: 'Chat',
    items: ['Message your team.', 'Type @ to mention a patient — click it to jump straight to their note.'],
  },
  {
    icon: Upload,
    title: 'Upload Tool',
    items: ['Once a note is signed, download it as a PDF here for manual upload to PCC.'],
  },
]

// A short, practical how-to rather than exhaustive docs — enough to get
// someone using every real feature of the app without digging through menus.
function InstructionsScreen() {
  return (
    <div className="instructions-screen">
      <h1>Instructions</h1>
      <p className="instructions-subtitle">A quick guide to what NOVA can do.</p>

      <div className="instructions-list">
        {SECTIONS.map(({ icon: Icon, title, items }) => (
          <div key={title} className="instructions-card">
            <div className="instructions-card-header">
              <Icon size={18} className="instructions-card-icon" />
              <h2>{title}</h2>
            </div>
            <ul>
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export default InstructionsScreen
