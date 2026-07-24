import { useEffect, useRef, useState } from 'react'
import './App.css'
import ChatPanel from './components/ChatPanel'
import CompletenessPanel, { type CompletenessStatus } from './components/CompletenessPanel'
import ImportPdfPanel from './components/ImportPdfPanel'
import OutputPanel, { type RewordStatus } from './components/OutputPanel'
import RoleSelectScreen from './components/RoleSelectScreen'
import SuggestionsPanel from './components/SuggestionsPanel'
import { ApiError, applySuggestions, rewordText, updateNoteWithAnswer } from './lib/apiClient'
import { checkCompletenessLocal } from './lib/completenessCheck'
import type { NoteType, Role } from './lib/types'

const SESSION_STORAGE_KEY = 'nova:session'

interface PersistedSession {
  extractedText: string | null
  reworded: string | null
  noteType: NoteType
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

  // Not persisted — always starts unset on a fresh load, so the role
  // picker is an explicit choice every time rather than silently carrying
  // over to whoever opens the tab next (e.g. a scribe-to-provider handoff
  // on a shared workstation).
  const [role, setRole] = useState<Role | null>(null)

  const [rewordStatus, setRewordStatus] = useState<RewordStatus>(persisted?.reworded ? 'done' : 'idle')
  const [reworded, setReworded] = useState<string | null>(persisted?.reworded ?? null)
  const [previousReworded, setPreviousReworded] = useState<string | null>(null)
  const [rewordError, setRewordError] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(persisted?.extractedText ?? null)
  const [noteType, setNoteType] = useState<NoteType>(persisted?.noteType ?? 'initial')

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
        const toStore: PersistedSession = { extractedText, reworded, noteType }
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(toStore))
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
      }
    } catch {
      // sessionStorage can be unavailable (private browsing, quota) —
      // autosave is a nice-to-have, not something worth surfacing an error for.
    }
  }, [extractedText, reworded, noteType])

  function applyRewordResult(result: string, baseline: string | null) {
    setPreviousReworded(baseline)
    setReworded(result)
    setRewordStatus('done')
    setNoteVersion((v) => v + 1)
    runCompletenessCheck(result)
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
  }

  function handleDismissDiff() {
    setPreviousReworded(null)
  }

  function handleRecheckCompleteness() {
    const text = reworded ?? extractedText
    if (text) runCompletenessCheck(text)
  }

  if (!role) {
    return <RoleSelectScreen onSelect={setRole} />
  }

  return (
    <div className="app-container">
      <div className="app-topbar">
        <button type="button" className="btn btn-sm" onClick={() => setRole(null)}>
          Switch role
        </button>
      </div>
      <div className="app-shell">
        <div className="left-column">
          <ImportPdfPanel noteType={noteType} onNoteTypeChange={setNoteType} onExtracted={handleExtracted} />
          <CompletenessPanel
            status={completenessStatus}
            verdict={verdict}
            missingItems={missingItems}
            onRecheck={handleRecheckCompleteness}
          />
        </div>
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
        />
      </div>
    </div>
  )
}

export default App
