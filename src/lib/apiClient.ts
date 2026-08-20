import type {
  ApiErrorResponse,
  ApplySuggestionsResponse,
  ChatHistoryMessage,
  ChatResponse,
  NoteType,
  Role,
  RewordResponse,
  Suggestion,
  SuggestionsResponse,
  TeamChatMessage,
  TeamMember,
  UpdateNoteResponse,
} from './types'

export class ApiError extends Error {}

function readErrorMessage(data: unknown): string {
  return (data as ApiErrorResponse | null)?.error ?? 'Something went wrong. Please try again.'
}

async function getJson<T>(url: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(url)
  } catch {
    throw new ApiError("Can't reach the server. Is it running?")
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(readErrorMessage(data))
  }

  return data as T
}

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
    throw new ApiError(readErrorMessage(data))
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

// The team roster, sign-up, and sign-in — see server/routes/team.js and
// server/userStore.js. No password yet; email is just the account's unique
// identifier for this test-run stage of the app.
export function fetchTeamRoster(): Promise<TeamMember[]> {
  return getJson<TeamMember[]>('/api/team')
}

export interface SignUpData {
  name: string
  email: string
  role: Role
  supervisorId: string | null
}

export function signUp(data: SignUpData): Promise<TeamMember> {
  return postJson<TeamMember>('/api/team/signup', data)
}

export function signIn(email: string): Promise<TeamMember> {
  return postJson<TeamMember>('/api/team/signin', { email })
}

// Team Chat — scoped per team (see server/routes/teamChat.js), so only
// people on the same team ever see or post into the same message list.
export function fetchTeamMessages(teamId: string): Promise<TeamChatMessage[]> {
  return getJson<TeamChatMessage[]>(`/api/team-chat?teamId=${encodeURIComponent(teamId)}`)
}

export function postTeamMessage(teamId: string, author: string, text: string): Promise<TeamChatMessage> {
  return postJson<TeamChatMessage>('/api/team-chat', { teamId, author, text })
}
