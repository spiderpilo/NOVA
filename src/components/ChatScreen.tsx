import { Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import './ChatScreen.css'
import { addMessage, listMessages } from '../lib/chatStore'
import { encodeMention, parseMessageTokens } from '../lib/mentionUtils'
import { listPatients } from '../lib/patientStore'
import type { Patient, TeamChatMessage } from '../lib/types'

const CURRENT_USER = 'You'
const MAX_MENTION_RESULTS = 6

interface Props {
  onOpenPatientNote: (patientId: string) => void
}

// A team channel, not the AI interview — providers/scribes reference
// patients constantly here, so typing "@" opens a patient picker and the
// resulting mention is a clickable chip that jumps straight to that
// patient's note (see App.tsx's handleOpenPatientNoteFromChat).
function ChatScreen({ onOpenPatientNote }: Props) {
  const [messages, setMessages] = useState<TeamChatMessage[]>(() => {
    // First-run seed so the channel doesn't look broken/empty — only once,
    // never re-seeded on later visits.
    if (listMessages().length === 0) {
      addMessage('Dr. Patel', 'Morning team — tag a patient with @ to link straight to their note from here.')
    }
    return listMessages()
  })
  const [input, setInput] = useState('')
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const mentionMatches =
    mentionQuery !== null
      ? listPatients()
          .filter((p) => p.name.toLowerCase().includes(mentionQuery.toLowerCase()))
          .slice(0, MAX_MENTION_RESULTS)
      : []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    const cursor = e.target.selectionStart
    setInput(value)

    const uptoCursor = value.slice(0, cursor)
    const atIndex = uptoCursor.lastIndexOf('@')
    if (atIndex !== -1 && !/\s/.test(uptoCursor.slice(atIndex + 1))) {
      setMentionStart(atIndex)
      setMentionQuery(uptoCursor.slice(atIndex + 1))
      setHighlightedIndex(0)
    } else {
      setMentionStart(null)
      setMentionQuery(null)
    }
  }

  function handleSelectMention(patient: Patient) {
    if (mentionStart === null) return
    const cursor = textareaRef.current?.selectionStart ?? input.length
    const before = input.slice(0, mentionStart)
    const after = input.slice(cursor)
    const token = encodeMention(patient.name, patient.id)
    const nextValue = `${before}${token} ${after}`
    setInput(nextValue)
    setMentionStart(null)
    setMentionQuery(null)

    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      const pos = before.length + token.length + 1
      el.setSelectionRange(pos, pos)
    })
  }

  function handleSend() {
    const text = input.trim()
    if (!text) return
    addMessage(CURRENT_USER, text)
    setMessages(listMessages())
    setInput('')
    setMentionStart(null)
    setMentionQuery(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && mentionMatches.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((i) => (i + 1) % mentionMatches.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((i) => (i - 1 + mentionMatches.length) % mentionMatches.length)
        return
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSelectMention(mentionMatches[highlightedIndex])
        return
      }
      if (e.key === 'Escape') {
        setMentionStart(null)
        setMentionQuery(null)
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-screen">
      <div className="chat-screen-header">
        <h1>Team Chat</h1>
        <p>Type @ to mention a patient — click a mention to open their note.</p>
      </div>

      <div className="chat-screen-messages">
        {messages.map((m) => (
          <div key={m.id} className="chat-screen-message">
            <div className="chat-screen-message-header">
              <span className="chat-screen-message-author">{m.author}</span>
              <span className="chat-screen-message-time">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            <p className="chat-screen-message-text">
              {parseMessageTokens(m.text).map((token, i) =>
                token.type === 'mention' ? (
                  <button
                    key={i}
                    type="button"
                    className="chat-screen-mention"
                    onClick={() => onOpenPatientNote(token.patientId)}
                  >
                    @{token.name}
                  </button>
                ) : (
                  <span key={i}>{token.value}</span>
                ),
              )}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-screen-input-area">
        {mentionQuery !== null && mentionMatches.length > 0 && (
          <div className="chat-screen-mention-menu">
            {mentionMatches.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={
                  i === highlightedIndex ? 'chat-screen-mention-item chat-screen-mention-item-active' : 'chat-screen-mention-item'
                }
                onMouseEnter={() => setHighlightedIndex(i)}
                onClick={() => handleSelectMention(p)}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          className="chat-screen-input"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Message the team — type @ to mention a patient"
          rows={2}
        />
        <button type="button" className="btn chat-screen-send" onClick={handleSend} disabled={!input.trim()}>
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

export default ChatScreen
