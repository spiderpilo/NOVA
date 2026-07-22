export type NoteType = 'initial' | 'followUp'

// POST /api/reword
export interface RewordRequest {
  text: string
  noteType: NoteType
}
export interface RewordResponse {
  reworded: string
}

// POST /api/chat
export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}
export interface ChatRequest {
  noteText: string
  history: ChatHistoryMessage[]
}
export interface ChatResponse {
  reply: string
}

// POST /api/update-note
export interface UpdateNoteRequest {
  noteText: string
  question: string
  answer: string
}
export interface UpdateNoteResponse {
  updatedNote: string
}

// POST /api/suggestions
export interface Suggestion {
  text: string
  category: string
}
export interface SuggestionsRequest {
  noteText: string
  originalText: string
}
export interface SuggestionsResponse {
  suggestions: Suggestion[]
}

// POST /api/apply-suggestions
export interface ApplySuggestionsRequest {
  noteText: string
  suggestions: string[]
}
export interface ApplySuggestionsResponse {
  updatedNote: string
}

export interface ApiErrorResponse {
  error: string
}
