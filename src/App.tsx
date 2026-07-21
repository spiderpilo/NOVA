import { useState } from 'react'
import './App.css'
import ChatPanel from './components/ChatPanel'
import CompletenessPanel, { type CompletenessStatus } from './components/CompletenessPanel'
import ImportPdfPanel from './components/ImportPdfPanel'
import OutputPanel, { type RewordStatus } from './components/OutputPanel'
import { ApiError, rewordText } from './lib/apiClient'
import { checkCompletenessLocal } from './lib/completenessCheck'

function App() {
  const [rewordStatus, setRewordStatus] = useState<RewordStatus>('idle')
  const [reworded, setReworded] = useState<string | null>(null)
  const [rewordError, setRewordError] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)

  const [completenessStatus, setCompletenessStatus] = useState<CompletenessStatus>('idle')
  const [verdict, setVerdict] = useState<string | null>(null)
  const [missingItems, setMissingItems] = useState<string[]>([])

  async function runReword(text: string) {
    setRewordStatus('loading')
    setRewordError(null)
    try {
      const result = await rewordText(text)
      setReworded(result)
      setRewordStatus('done')
      runCompletenessCheck(result)
    } catch (err) {
      setRewordError(err instanceof ApiError ? err.message : 'Failed to reword text.')
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

  function handleOutputChange(text: string) {
    setReworded(text)
  }

  function handleRecheckCompleteness() {
    const text = reworded ?? extractedText
    if (text) runCompletenessCheck(text)
  }

  return (
    <div className="app-shell">
      <div className="left-column">
        <ImportPdfPanel onExtracted={handleExtracted} />
        <CompletenessPanel
          status={completenessStatus}
          verdict={verdict}
          missingItems={missingItems}
          onRecheck={handleRecheckCompleteness}
        />
      </div>
      <ChatPanel />
      <OutputPanel
        status={rewordStatus}
        reworded={reworded}
        error={rewordError}
        onRetry={handleRetryReword}
        onChange={handleOutputChange}
      />
    </div>
  )
}

export default App
