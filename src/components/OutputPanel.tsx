import { useState } from 'react'
import './OutputPanel.css'

export type RewordStatus = 'idle' | 'loading' | 'error' | 'done'

interface Props {
  status: RewordStatus
  reworded: string | null
  error: string | null
  onRetry: () => void
  onChange: (text: string) => void
}

function OutputPanel({ status, reworded, error, onRetry, onChange }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!reworded) return
    await navigator.clipboard.writeText(reworded)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="panel">
      <div className="output-header">
        <h2>Reworded Output</h2>
        {status === 'done' && reworded && (
          <button type="button" className="copy-button" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy text'}
          </button>
        )}
      </div>
      <div className="panel-content output-content">
        {status === 'idle' && <p className="output-placeholder">Import a PDF to see the reworded note here.</p>}
        {status === 'loading' && <p className="output-placeholder">Rewording…</p>}
        {status === 'error' && (
          <div className="output-error">
            <p>{error}</p>
            <button type="button" onClick={onRetry}>
              Try again
            </button>
          </div>
        )}
        {status === 'done' && reworded !== null && (
          <textarea
            className="output-text"
            value={reworded}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
          />
        )}
      </div>
    </section>
  )
}

export default OutputPanel
