import { useState } from 'react'
import { diffWords } from 'diff'
import './OutputPanel.css'

export type RewordStatus = 'idle' | 'loading' | 'error' | 'done'

interface Props {
  status: RewordStatus
  reworded: string | null
  previousReworded: string | null
  error: string | null
  onRetry: () => void
  onChange: (text: string) => void
  onDismissDiff: () => void
}

function OutputPanel({ status, reworded, previousReworded, error, onRetry, onChange, onDismissDiff }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!reworded) return
    await navigator.clipboard.writeText(reworded)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const showDiff = status === 'done' && reworded !== null && previousReworded !== null

  return (
    <section className="panel">
      <div className="output-header">
        <h2>Reworded Output</h2>
        {status === 'done' && reworded && (
          <button type="button" className="btn btn-sm" onClick={handleCopy}>
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
            <button type="button" className="btn" onClick={onRetry}>
              Try again
            </button>
          </div>
        )}
        {status === 'done' && reworded !== null && showDiff && (
          <div className="output-diff-wrap">
            <div className="output-diff-banner">
              <span>Highlighted: what changed from the interview</span>
              <button type="button" className="btn btn-sm" onClick={onDismissDiff}>
                Edit note
              </button>
            </div>
            <pre className="output-text output-diff">
              {diffWords(previousReworded, reworded)
                .filter((part) => !part.removed)
                .map((part, i) =>
                  part.added ? (
                    <span key={i} className="diff-added">
                      {part.value}
                    </span>
                  ) : (
                    <span key={i}>{part.value}</span>
                  ),
                )}
            </pre>
          </div>
        )}
        {status === 'done' && reworded !== null && !showDiff && (
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
