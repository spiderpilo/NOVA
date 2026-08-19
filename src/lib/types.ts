export type NoteType = 'initial' | 'followUp'

export type Role = 'provider' | 'scribe'

// Stored locally per patient (see lib/patientStore.ts) — this is a test-run
// stand-in for real per-patient storage, not a cloud-backed record.
export interface Patient {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  noteType: NoteType
  extractedText: string | null
  reworded: string | null
  signed: boolean
  signedAt: number | null
  uploaded: boolean
  uploadedAt: number | null
  // Which day's rounds this patient belongs to — a YYYY-MM-DD key (see
  // lib/dateUtils.ts), not a timestamp, since it's a calendar day grouping
  // rather than a moment in time.
  roundingDate: string
  // Which team owns this patient — always a provider's TeamMember id (see
  // lib/team.ts's resolveTeamId), whether the patient was added by that
  // provider or one of their scribes. Scopes every patient list to "your
  // team" once someone logs in.
  teamId: string
  // Which facility (SNF, hospital floor, etc.) the patient is being seen
  // at — freeform, since a practice can round at many different sites.
  // Surfaced on the patient list so a provider juggling several
  // facilities can tell patients apart at a glance.
  facility: string
}

// A message on the Team Chat page (see server/messageStore.js, fetched via
// lib/apiClient.ts) — distinct from ChatHistoryMessage below, which is the
// AI interview's own message shape and unrelated to this human-to-human
// channel. Scoped to one team — only people on the same team see it.
export interface TeamChatMessage {
  id: string
  teamId: string
  author: string
  text: string
  createdAt: number
}

// A registered account, persisted server-side (see server/userStore.js,
// fetched via lib/apiClient.ts). Providers supervise scribes —
// supervisorId names which provider a scribe signed up under, and is
// always null for a provider.
export interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
  supervisorId: string | null
}

// Identity of whoever is currently signed in (see App.tsx's handleLogin) —
// set the moment sign-in/sign-up succeeds on LoginScreen, and gone the
// moment they sign out. Not persisted across a page reload — see App.tsx.
// teamId is derived from the TeamMember at login time (see lib/team.ts's
// resolveTeamId) and is what scopes every patient list.
export interface CurrentUser {
  id: string
  name: string
  email: string
  role: Role
  teamId: string
}

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
