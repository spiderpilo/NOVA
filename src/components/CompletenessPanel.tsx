import './CompletenessPanel.css'

export type CompletenessStatus = 'idle' | 'done'

interface Props {
  status: CompletenessStatus
  verdict: string | null
  missingItems: string[]
  onRecheck: () => void
}

function CompletenessPanel({ status, verdict, missingItems, onRecheck }: Props) {
  return (
    <section className="panel">
      <div className="completeness-header">
        <h2>Completeness Check</h2>
        {status === 'done' && (
          <button type="button" className="recheck-button" onClick={onRecheck}>
            Update check
          </button>
        )}
      </div>
      <div className="panel-content completeness-content">
        {status === 'idle' && (
          <p className="completeness-placeholder">Import a PDF to scan it for sections worth double-checking.</p>
        )}
        {status === 'done' && (
          <div className="completeness-result">
            <p className={missingItems.length > 0 ? 'completeness-verdict-warn' : 'completeness-verdict-ok'}>
              {verdict}
            </p>
            {missingItems.length > 0 && (
              <ul className="completeness-missing-list">
                {missingItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default CompletenessPanel
