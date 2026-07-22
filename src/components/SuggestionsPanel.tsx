import { useEffect, useRef, useState } from 'react'
import './SuggestionsPanel.css'
import { ApiError, getSuggestions } from '../lib/apiClient'
import type { Suggestion } from '../lib/types'

const SUGGESTIONS_STORAGE_KEY = 'nova:suggestions'

interface PersistedSuggestions {
  forExtractedText: string
  suggestions: Suggestion[]
  selected: Suggestion[]
}

function loadPersistedSuggestions(): PersistedSuggestions | null {
  try {
    const raw = sessionStorage.getItem(SUGGESTIONS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedSuggestions) : null
  } catch {
    return null
  }
}

interface Props {
  noteText: string | null
  originalText: string | null
  noteVersion: number
  onApply: (selected: string[]) => void
}

function SuggestionsPanel({ noteText, originalText, noteVersion, onApply }: Props) {
  const persisted = useRef(loadPersistedSuggestions()).current
  const matchesPersisted = persisted !== null && persisted.forExtractedText === originalText

  const [suggestions, setSuggestions] = useState<Suggestion[]>(matchesPersisted ? persisted.suggestions : [])
  const [selected, setSelected] = useState<Suggestion[]>(matchesPersisted ? persisted.selected : [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Suppress the auto-refresh effect from immediately overwriting rehydrated
  // suggestions — noteVersion resets to 0 on every fresh mount, so matching
  // it here (rather than trying to persist/restore the counter itself) is
  // enough to prevent a spurious refetch right after reload.
  const startedForRef = useRef<number | null>(matchesPersisted ? noteVersion : null)

  useEffect(() => {
    try {
      if (originalText) {
        const toStore: PersistedSuggestions = { forExtractedText: originalText, suggestions, selected }
        sessionStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(toStore))
      }
    } catch {
      // autosave is best-effort — sessionStorage may be unavailable
    }
  }, [originalText, suggestions, selected])

  // Refreshes suggestions after each AI-driven note change (reword, chat
  // answer, applied suggestion) — keyed on noteVersion rather than noteText
  // itself, since noteText also changes on every keystroke of a manual edit
  // and we don't want to re-fetch on every character typed.
  useEffect(() => {
    if (!noteText || !originalText) return
    if (startedForRef.current === noteVersion) return
    startedForRef.current = noteVersion
    void fetchSuggestions(noteText, originalText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteVersion, noteText, originalText])

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
    startedForRef.current = noteVersion
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

  function renderSuggestion(s: Suggestion, selectedStyle: boolean, onClick: () => void) {
    return (
      <button
        type="button"
        className={selectedStyle ? 'suggestion-item suggestion-item-selected' : 'suggestion-item'}
        onClick={onClick}
      >
        <span className="suggestion-category">{s.category}</span>
        <span className="suggestion-text">{s.text}</span>
        {s.category === 'Medications' && (
          <span className="suggestion-med-caveat">
            Verify against allergies, interactions, and renal/hepatic function before prescribing.
          </span>
        )}
      </button>
    )
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
                  <li key={i}>{renderSuggestion(s, false, () => selectSuggestion(s))}</li>
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
                    <li key={i}>{renderSuggestion(s, true, () => deselectSuggestion(s))}</li>
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
