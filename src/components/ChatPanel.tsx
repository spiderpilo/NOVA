import { useEffect, useRef, useState } from 'react'
import './ChatPanel.css'
import { ApiError, sendChatMessage } from '../lib/apiClient'
import type { ChatHistoryMessage } from '../lib/types'

interface Props {
  extractedText: string | null
  currentNoteText: string | null
  onAnswer: (question: string, answer: string) => void
}

function ChatPanel({ extractedText, currentNoteText, onAnswer }: Props) {
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const startedForRef = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Grows the answer box to fit what's typed (up to the CSS max-height,
  // after which it scrolls internally) — covers both the user typing and
  // the box clearing itself after send/skip.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [input])

  // Starts the interview once, the first time a reworded note is available
  // for this imported PDF — not on every later regeneration of that note.
  useEffect(() => {
    if (!extractedText || !currentNoteText) return
    if (startedForRef.current === extractedText) return
    startedForRef.current = extractedText
    setMessages([])
    setDone(false)
    setError(null)
    void askNext([], currentNoteText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extractedText, currentNoteText])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function askNext(history: ChatHistoryMessage[], noteTextForCall: string) {
    setLoading(true)
    setError(null)
    try {
      const reply = await sendChatMessage(noteTextForCall, history)
      if (reply.trim().toUpperCase() === 'DONE') {
        setDone(true)
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to get a response.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    const answer = input.trim()
    if (!answer || loading || done || !currentNoteText || messages.length === 0) return

    const lastQuestion = [...messages].reverse().find((m) => m.role === 'assistant')?.content
    const nextMessages: ChatHistoryMessage[] = [...messages, { role: 'user', content: answer }]
    setMessages(nextMessages)
    setInput('')

    if (lastQuestion) onAnswer(lastQuestion, answer)

    await askNext(nextMessages, currentNoteText)
  }

  // Skipping doesn't call onAnswer — there's no new information to add to
  // the note, so it shouldn't trigger a regeneration. It just tells the
  // model to move on, same as answering "I don't know" would.
  async function handleSkip() {
    if (loading || done || !currentNoteText || messages.length === 0) return

    const nextMessages: ChatHistoryMessage[] = [
      ...messages,
      { role: 'user', content: "I don't know — let's skip this one." },
    ]
    setMessages(nextMessages)
    setInput('')

    await askNext(nextMessages, currentNoteText)
  }

  const idle = !extractedText

  return (
    <section className="panel chat-panel">
      <h2>AI Chat</h2>
      <div className="panel-content chat-content">
        {idle && <p className="chat-placeholder">Import a PDF to start the interview.</p>}

        {!idle && (
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble chat-bubble-${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && <div className="chat-bubble chat-bubble-assistant chat-bubble-loading">…</div>}
            {done && (
              <p className="chat-done">That's everything — the note has been updated with what you shared.</p>
            )}
            {error && <p className="chat-error">{error}</p>}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      {!idle && !done && (
        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
            placeholder="Type your answer…"
            rows={1}
            disabled={loading || messages.length === 0}
          />
          <div className="chat-input-actions">
            <button
              type="button"
              className="btn btn-sm chat-skip-button"
              onClick={() => void handleSkip()}
              disabled={loading || messages.length === 0}
            >
              Skip
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => void handleSend()}
              disabled={loading || !input.trim() || messages.length === 0}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default ChatPanel
