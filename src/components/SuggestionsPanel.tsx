import { useEffect, useRef, useState } from 'react'
import './SuggestionsPanel.css'
import { ApiError, getSuggestions } from '../lib/apiClient'
import type { Suggestion } from '../lib/types'

interface Props {
  noteText: string | null
  originalText: string | null
  onApply: (selected: string[]) => void
}

function SuggestionsPanel({ noteText, originalText, onApply }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selected, setSelected] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedForRef = useRef<string | null>(null)

  // Generates suggestions once, the first time a reworded note is available
  // for this imported PDF — refreshing afterward is a manual action, since
  // regenerating automatically on every note change would be noisy and costly.
  useEffect(() => {
    if (!noteText || !originalText) return
    if (startedForRef.current === noteText) return
    startedForRef.current = noteText
    void fetchSuggestions(noteText, originalText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteText, originalText])

  async function fetchSuggestions(note: string, original: string) {
    setLoading(true)
    setError(null)
    try {
      const result = await getSuggestions(note, original)
      setSuggestions(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load suggestions.')
    } finally {
      setLoading(false)
    }
  }

  function handleRefresh() {
    if (!noteText || !originalText) return
    setSelected([])
    startedForRef.current = noteText
    void fetchSuggestions(noteText, originalText)
  }

  function selectSuggestion(s: Suggestion) {
    setSuggestions((prev) => prev.filter((item) => item !== s))
    setSelected((prev) => [...prev, s])
  }

  function deselectSuggestion(s: Suggestion) {
    setSelected((prev) => prev.filter((item) => item !== s))
    setSuggestions((prev) => [...prev, s])
  }

  // Applying is fire-and-forget from here — App owns the actual API call and
  // the resulting note/diff state, surfaced through the Output panel, same
  // as how answering a chat question works.
  function handleApply() {
    if (selected.length === 0) return
    onApply(selected.map((s) => s.text))
    setSelected([])
  }

  const idle = !noteText

  return (
    <section className="panel suggestions-panel">
      <div className="suggestions-header">
        <h2>AI Suggestions</h2>
        {!idle && (
          <button type="button" className="btn btn-sm" onClick={handleRefresh} disabled={loading}>
            Refresh
          </button>
        )}
      </div>
      <div className="panel-content suggestions-content">
        {idle && <p className="suggestions-placeholder">Import a PDF to get AI suggestions.</p>}

        {!idle && (
          <>
            {loading && <p className="suggestions-placeholder">Analyzing note…</p>}
            {error && <p className="suggestions-error">{error}</p>}

            {!loading && !error && suggestions.length === 0 && selected.length === 0 && (
              <p className="suggestions-placeholder">No suggestions right now.</p>
            )}

            {suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button type="button" className="suggestion-item" onClick={() => selectSuggestion(s)}>
                      <span className="suggestion-category">{s.category}</span>
                      <span className="suggestion-text">{s.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="selected-suggestions">
              <h3>Selected Suggestions</h3>
              {selected.length === 0 ? (
                <p className="suggestions-placeholder suggestions-placeholder-small">
                  Click a suggestion above to add it here.
                </p>
              ) : (
                <ul className="suggestions-list">
                  {selected.map((s, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className="suggestion-item suggestion-item-selected"
                        onClick={() => deselectSuggestion(s)}
                      >
                        <span className="suggestion-category">{s.category}</span>
                        <span className="suggestion-text">{s.text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="btn apply-suggestions-button"
                onClick={handleApply}
                disabled={selected.length === 0}
              >
                Apply Suggestions
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default SuggestionsPanel
