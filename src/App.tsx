import { ArrowLeft, Check, MessageCircle, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import './App.css'
import ChatPanel from './components/ChatPanel'
import ChatScreen from './components/ChatScreen'
import CompletenessPanel, { type CompletenessStatus } from './components/CompletenessPanel'
import ImportPdfPanel from './components/ImportPdfPanel'
import InstructionsScreen from './components/InstructionsScreen'
import LoginScreen from './components/LoginScreen'
import OutputPanel, { type RewordStatus } from './components/OutputPanel'
import PatientListScreen, { type PatientFilter } from './components/PatientListScreen'
import RoleSelectScreen from './components/RoleSelectScreen'
import SuggestionsPanel from './components/SuggestionsPanel'
import TaskBar from './components/TaskBar'
import TeamScreen from './components/TeamScreen'
import UploadToolScreen from './components/UploadToolScreen'
import { ApiError, applySuggestions, rewordText, updateNoteWithAnswer } from './lib/apiClient'
import { checkCompletenessLocal } from './lib/completenessCheck'
import { getPatientById, updatePatientNote } from './lib/patientStore'
import { resolveTeamId } from './lib/team'
import type { CurrentUser, NoteType, Patient, TeamMember } from './lib/types'

const SESSION_STORAGE_KEY = 'nova:session'

interface PersistedSession {
  extractedText: string | null
  reworded: string | null
  noteType: NoteType
  selectedPatientId: string | null
  selectedPatientName: string | null
  signed: boolean
  signedAt: number | null
}

function loadPersistedSession(): PersistedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedSession) : null
  } catch {
    return null
  }
}

function App() {
  const persisted = useRef(loadPersistedSession()).current

  // Not persisted — always starts unset on a fresh load, so signing in is
  // an explicit choice every time rather than silently carrying over to
  // whoever opens the tab next (e.g. a scribe-to-provider handoff on a
  // shared workstation). Everything else on screen — which team's patients
  // show up, which role's panels render — is derived from this.
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  // 'home' is the dashboard landing page; 'app' is the note workspace.
  // 'patients'/'upload'/'instructions'/'team' overlay whichever of those is
  // current — they don't replace the state underneath, so returning from
  // any of them lands back where you were. Chat isn't one of these — it's
  // a docked drawer (see chatOpen) reachable from every screen at once,
  // not a screen you navigate to and away from.
  const [screen, setScreen] = useState<'home' | 'app' | 'patients' | 'upload' | 'instructions' | 'team'>('home')
  // The floating chat button toggles this from anywhere in the app —
  // opening it narrows .app-page-content rather than replacing it, so
  // whatever screen you're on stays visible alongside the chat.
  const [chatOpen, setChatOpen] = useState(false)
  const [patientFilter, setPatientFilter] = useState<PatientFilter>({})
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(persisted?.selectedPatientId ?? null)
  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(persisted?.selectedPatientName ?? null)

  const [rewordStatus, setRewordStatus] = useState<RewordStatus>(persisted?.reworded ? 'done' : 'idle')
  const [reworded, setReworded] = useState<string | null>(persisted?.reworded ?? null)
  const [previousReworded, setPreviousReworded] = useState<string | null>(null)
  const [rewordError, setRewordError] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(persisted?.extractedText ?? null)
  const [noteType, setNoteType] = useState<NoteType>(persisted?.noteType ?? 'initial')

  // A provider's signature attests to the note text as it stood at sign
  // time — any further edit (manual or AI-applied) invalidates it, so it
  // gets cleared automatically rather than silently going stale.
  const [signed, setSigned] = useState(persisted?.signed ?? false)
  const [signedAt, setSignedAt] = useState<number | null>(persisted?.signedAt ?? null)

  const [completenessStatus, setCompletenessStatus] = useState<CompletenessStatus>('idle')
  const [verdict, setVerdict] = useState<string | null>(null)
  const [missingItems, setMissingItems] = useState<string[]>([])

  // Bumped only on AI-driven regenerations (reword, chat answer, applied
  // suggestions) — used to trigger the Suggestions panel's auto-refresh
  // without it also firing on every keystroke of a manual edit, since
  // reworded itself changes on every keystroke too.
  const [noteVersion, setNoteVersion] = useState(0)

  // Whatever reword-affecting operation most recently ran — retry re-runs
  // exactly that, instead of always falling back to a full reword from the
  // original PDF text and silently discarding chat/suggestion progress.
  const lastOperationRef = useRef<(() => void) | null>(null)

  // Restore the completeness check for a rehydrated note on first mount —
  // it's cheap to recompute locally, so it isn't part of persisted state.
  useEffect(() => {
    if (reworded) runCompletenessCheck(reworded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      if (extractedText || reworded) {
        const toStore: PersistedSession = {
          extractedText,
          reworded,
          noteType,
          selectedPatientId,
          selectedPatientName,
          signed,
          signedAt,
        }
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(toStore))
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
      }
    } catch {
      // sessionStorage can be unavailable (private browsing, quota) —
      // autosave is a nice-to-have, not something worth surfacing an error for.
    }
  }, [extractedText, reworded, noteType, selectedPatientId, selectedPatientName, signed, signedAt])

  // Mirrors the sessionStorage autosave above, but keyed to a specific
  // patient in localStorage — only runs once a patient has actually been
  // selected from the Patients screen, so ad-hoc single-note use (no
  // patient tracking) is unaffected.
  useEffect(() => {
    if (!selectedPatientId) return
    updatePatientNote(selectedPatientId, { noteType, extractedText, reworded, signed, signedAt })
  }, [selectedPatientId, noteType, extractedText, reworded, signed, signedAt])

  // Loads a patient's stored note into the workspace, the same way a fresh
  // PDF import would — extractedText changing is what the Chat/Suggestions
  // panels already key their per-document resets off of, so switching
  // patients naturally clears any leftover chat draft or stale suggestion
  // selection from whoever was open before.
  function handleSelectPatient(patient: Patient) {
    setSelectedPatientId(patient.id)
    setSelectedPatientName(patient.name)
    setNoteType(patient.noteType)
    setExtractedText(patient.extractedText)
    setReworded(patient.reworded)
    setPreviousReworded(null)
    setRewordError(null)
    setRewordStatus(patient.reworded ? 'done' : 'idle')
    setSigned(patient.signed ?? false)
    setSignedAt(patient.signedAt ?? null)
    lastOperationRef.current = null
    setNoteVersion((v) => v + 1)
    if (patient.reworded) {
      runCompletenessCheck(patient.reworded)
    } else {
      setCompletenessStatus('idle')
      setVerdict(null)
      setMissingItems([])
    }
    setScreen('app')
  }

  // Shared by handleDeletePatient (the deleted patient was open) and
  // handleSignOut (privacy — the next person to sign in on a shared
  // workstation shouldn't see a leftover note from whoever was here
  // before, especially now that it could belong to a different team).
  function resetWorkspace() {
    setSelectedPatientId(null)
    setSelectedPatientName(null)
    setNoteType('initial')
    setExtractedText(null)
    setReworded(null)
    setPreviousReworded(null)
    setRewordError(null)
    setRewordStatus('idle')
    setCompletenessStatus('idle')
    setVerdict(null)
    setMissingItems([])
    setSigned(false)
    setSignedAt(null)
    setNoteVersion((v) => v + 1)
  }

  function handleDeletePatient(id: string) {
    if (id !== selectedPatientId) return
    resetWorkspace()
  }

  function applyRewordResult(result: string, baseline: string | null) {
    setPreviousReworded(baseline)
    setReworded(result)
    setRewordStatus('done')
    setSigned(false)
    setSignedAt(null)
    setNoteVersion((v) => v + 1)
    runCompletenessCheck(result)
  }

  function handleSignNote() {
    setSigned(true)
    setSignedAt(Date.now())
  }

  function handleUnsignNote() {
    setSigned(false)
    setSignedAt(null)
  }

  async function runReword(text: string) {
    lastOperationRef.current = () => runReword(text)
    setRewordStatus('loading')
    setRewordError(null)
    try {
      const result = await rewordText(text, noteType)
      applyRewordResult(result, null)
    } catch (err) {
      setRewordError(err instanceof ApiError ? err.message : 'Failed to reword text.')
      setRewordStatus('error')
    }
  }

  // Chat answers don't reword the note from scratch — that would let the AI
  // rephrase unrelated sentences on every answer, making the diff highlight
  // noisy. Instead this edits the current note in place, touching only what
  // the new answer actually affects, so the highlight reflects real changes.
  async function handleChatAnswer(question: string, answer: string) {
    if (!reworded) return
    const baseline = reworded
    lastOperationRef.current = () => handleChatAnswer(question, answer)
    setRewordStatus('loading')
    setRewordError(null)
    try {
      const result = await updateNoteWithAnswer(reworded, question, answer)
      applyRewordResult(result, baseline)
    } catch (err) {
      setRewordError(err instanceof ApiError ? err.message : 'Failed to update the note.')
      setRewordStatus('error')
    }
  }

  // Same precise, preserve-everything-else editing approach as chat answers
  // — only now the "new information" is one or more physician-selected
  // suggestions instead of a Q&A pair.
  async function handleApplySuggestions(selected: string[]) {
    if (!reworded) return
    const baseline = reworded
    lastOperationRef.current = () => handleApplySuggestions(selected)
    setRewordStatus('loading')
    setRewordError(null)
    try {
      const result = await applySuggestions(reworded, selected)
      applyRewordResult(result, baseline)
    } catch (err) {
      setRewordError(err instanceof ApiError ? err.message : 'Failed to apply suggestions.')
      setRewordStatus('error')
    }
  }

  function runCompletenessCheck(text: string) {
    const result = checkCompletenessLocal(text)
    setVerdict(result.verdict)
    setMissingItems(result.missingItems)
    setCompletenessStatus('done')
  }

  function handleExtracted(text: string) {
    setExtractedText(text)
    void runReword(text)
    runCompletenessCheck(text)
  }

  function handleRetryReword() {
    lastOperationRef.current?.()
  }

  // Deliberately doesn't clear previousReworded — the diff highlighting
  // should stay visible while editing, not vanish on the first keystroke.
  // Only handleDismissDiff (the "Clear highlights" button) drops it.
  function handleOutputChange(text: string) {
    setReworded(text)
    if (signed) {
      setSigned(false)
      setSignedAt(null)
    }
  }

  function handleDismissDiff() {
    setPreviousReworded(null)
  }

  function handleRecheckCompleteness() {
    const text = reworded ?? extractedText
    if (text) runCompletenessCheck(text)
  }

  function handleOpenPatients(filter: PatientFilter = {}) {
    setPatientFilter(filter)
    setScreen('patients')
  }

  function handleOpenPatientNoteFromChat(patientId: string) {
    const patient = getPatientById(patientId)
    if (!patient) return
    handleSelectPatient(patient)
  }

  // Picking a name on LoginScreen is what "logging in" means for this
  // prototype — it sets both role and team for the session in one step.
  function handleLogin(member: TeamMember) {
    setCurrentUser({ id: member.id, name: member.name, email: member.email, role: member.role, teamId: resolveTeamId(member) })
    setScreen('home')
  }

  function handleSignOut() {
    resetWorkspace()
    setCurrentUser(null)
    setScreen('home')
  }

  let pageContent: ReactNode

  // The single canonical "go home" action, used by the TaskBar's Home
  // button regardless of which screen it's clicked from.
  function handleGoHome() {
    setScreen('home')
  }

  if (!currentUser) {
    pageContent = <LoginScreen onLogin={handleLogin} />
  } else if (screen === 'patients') {
    pageContent = (
      <PatientListScreen
        teamId={currentUser.teamId}
        canSign={currentUser.role === 'provider'}
        activePatientId={selectedPatientId}
        initialFilter={patientFilter}
        onSelect={handleSelectPatient}
        onDelete={handleDeletePatient}
      />
    )
  } else if (screen === 'upload') {
    pageContent = <UploadToolScreen teamId={currentUser.teamId} />
  } else if (screen === 'instructions') {
    pageContent = <InstructionsScreen />
  } else if (screen === 'team') {
    pageContent = <TeamScreen currentUser={currentUser} />
  } else if (screen === 'home') {
    pageContent = (
      <RoleSelectScreen
        teamId={currentUser.teamId}
        onOpenAllPatients={() => handleOpenPatients()}
        onOpenAwaitingSignature={() => handleOpenPatients({ status: 'awaitingSignature' })}
        onOpenNeedsUpload={() => setScreen('upload')}
        onOpenNoNoteYet={() => handleOpenPatients({ status: 'noNote' })}
        onOpenRoundingDate={(date) => handleOpenPatients({ roundingDate: date })}
      />
    )
  } else {
    const role = currentUser.role
    pageContent = (
      <div className="app-container">
        <div className="app-topbar">
          <div className="app-topbar-left">
            <button type="button" className="btn btn-sm" onClick={() => handleOpenPatients()}>
              <ArrowLeft size={15} />
              Back
            </button>
            <span className="app-topbar-patient">
              {selectedPatientName ? `Patient: ${selectedPatientName}` : 'No patient selected'}
            </span>
          </div>
          <div className="app-topbar-actions">
            <button type="button" className="btn btn-sm" onClick={() => handleOpenPatients()}>
              <Check size={15} />
              Done
            </button>
          </div>
        </div>
        <div className={role === 'provider' ? 'app-shell app-shell-provider' : 'app-shell'}>
          {role === 'scribe' && (
            <div className="left-column">
              <ImportPdfPanel noteType={noteType} onNoteTypeChange={setNoteType} onExtracted={handleExtracted} />
              <CompletenessPanel
                status={completenessStatus}
                verdict={verdict}
                missingItems={missingItems}
                onRecheck={handleRecheckCompleteness}
              />
            </div>
          )}
          {role === 'scribe' && (
            <ChatPanel extractedText={extractedText} currentNoteText={reworded} onAnswer={handleChatAnswer} />
          )}
          {role === 'provider' && (
            <SuggestionsPanel
              noteText={reworded}
              originalText={extractedText}
              noteVersion={noteVersion}
              onApply={handleApplySuggestions}
            />
          )}
          <OutputPanel
            status={rewordStatus}
            reworded={reworded}
            previousReworded={previousReworded}
            error={rewordError}
            onRetry={handleRetryReword}
            onChange={handleOutputChange}
            onDismissDiff={handleDismissDiff}
            idleMessage={role === 'provider' ? 'Select a patient to review their note.' : undefined}
            showSignOff={role === 'provider'}
            signed={signed}
            signedAt={signedAt}
            onSign={handleSignNote}
            onUnsign={handleUnsignNote}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell-root">
      <TaskBar
        currentUser={currentUser}
        onHome={handleGoHome}
        onOpenInstructions={() => setScreen('instructions')}
        onOpenPatients={() => handleOpenPatients()}
        onOpenTeam={() => setScreen('team')}
        onOpenUploadTool={() => setScreen('upload')}
        onSignOut={handleSignOut}
      />
      <div className="app-body">
        <div className="app-page-content">{pageContent}</div>
        {currentUser && chatOpen && (
          <div className="chat-drawer">
            <button type="button" className="chat-drawer-close" onClick={() => setChatOpen(false)} aria-label="Close chat">
              <X size={16} />
            </button>
            <ChatScreen teamId={currentUser.teamId} currentUserName={currentUser.name} onOpenPatientNote={handleOpenPatientNoteFromChat} />
          </div>
        )}
      </div>
      {/* Hidden while the drawer is open — the drawer's own close button
          sits in that same bottom-right corner otherwise, and a fixed FAB
          on top of the drawer would cover its send button. */}
      {currentUser && !chatOpen && (
        <button type="button" className="chat-fab" onClick={() => setChatOpen(true)} aria-label="Open chat">
          <MessageCircle size={22} />
        </button>
      )}
    </div>
  )
}

export default App
