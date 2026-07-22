import type {
  ApiErrorResponse,
  ApplySuggestionsResponse,
  ChatHistoryMessage,
  ChatResponse,
  NoteType,
  RewordResponse,
  Suggestion,
  SuggestionsResponse,
  UpdateNoteResponse,
} from './types'

export class ApiError extends Error {}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError("Can't reach the server. Is it running?")
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = (data as ApiErrorResponse | null)?.error ?? 'Something went wrong. Please try again.'
    throw new ApiError(message)
  }

  return data as T
}

export function rewordText(text: string, noteType: NoteType): Promise<string> {
  return postJson<RewordResponse>('/api/reword', { text, noteType }).then((r) => r.reworded)
}

export function sendChatMessage(noteText: string, history: ChatHistoryMessage[]): Promise<string> {
  return postJson<ChatResponse>('/api/chat', { noteText, history }).then((r) => r.reply)
}

export function updateNoteWithAnswer(noteText: string, question: string, answer: string): Promise<string> {
  return postJson<UpdateNoteResponse>('/api/update-note', { noteText, question, answer }).then((r) => r.updatedNote)
}

export function getSuggestions(noteText: string, originalText: string): Promise<Suggestion[]> {
  return postJson<SuggestionsResponse>('/api/suggestions', { noteText, originalText }).then((r) => r.suggestions)
}

export function applySuggestions(noteText: string, suggestions: string[]): Promise<string> {
  return postJson<ApplySuggestionsResponse>('/api/apply-suggestions', { noteText, suggestions }).then(
    (r) => r.updatedNote,
  )
}
