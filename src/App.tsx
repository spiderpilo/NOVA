import { useState } from 'react'
import './App.css'
import ChatPanel from './components/ChatPanel'
import CompletenessPanel, { type CompletenessStatus } from './components/CompletenessPanel'
import ImportPdfPanel from './components/ImportPdfPanel'
import OutputPanel, { type RewordStatus } from './components/OutputPanel'
import SuggestionsPanel from './components/SuggestionsPanel'
import { ApiError, applySuggestions, rewordText, updateNoteWithAnswer } from './lib/apiClient'
import { checkCompletenessLocal } from './lib/completenessCheck'
import type { NoteType } from './lib/types'

function App() {
  const [rewordStatus, setRewordStatus] = useState<RewordStatus>('idle')
  const [reworded, setReworded] = useState<string | null>(null)
  const [previousReworded, setPreviousReworded] = useState<string | null>(null)
  const [rewordError, setRewordError] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [noteType, setNoteType] = useState<NoteType>('initial')

  const [completenessStatus, setCompletenessStatus] = useState<CompletenessStatus>('idle')
  const [verdict, setVerdict] = useState<string | null>(null)
  const [missingItems, setMissingItems] = useState<string[]>([])

  // Bumped only on AI-driven regenerations (reword, chat answer, applied
  // suggestions) — used to trigger the Suggestions panel's auto-refresh
  // without it also firing on every keystroke of a manual edit, since
  // reworded itself changes on every keystroke too.
  const [noteVersion, setNoteVersion] = useState(0)

  function applyRewordResult(result: string, baseline: string | null) {
    setPreviousReworded(baseline)
    setReworded(result)
    setRewordStatus('done')
    setNoteVersion((v) => v + 1)
    runCompletenessCheck(result)
  }

  async function runReword(text: string) {
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
    if (extractedText) void runReword(extractedText)
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

  return (
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
      <ChatPanel extractedText={extractedText} currentNoteText={reworded} onAnswer={handleChatAnswer} />
      <SuggestionsPanel
        noteText={reworded}
        originalText={extractedText}
        noteVersion={noteVersion}
        onApply={handleApplySuggestions}
      />
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
  )
}

export default App
