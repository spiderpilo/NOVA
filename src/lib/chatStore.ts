import type { TeamChatMessage } from './types'

// localStorage — same test-run stand-in pattern as patientStore.ts, not a
// real multi-user backend (no server, no other browsers see these).
const CHAT_KEY = 'nova:teamChat'

function readAll(): TeamChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY)
    return raw ? (JSON.parse(raw) as TeamChatMessage[]) : []
  } catch {
    return []
  }
}

function writeAll(messages: TeamChatMessage[]) {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages))
  } catch {
    // best-effort — localStorage may be unavailable (private browsing, quota)
  }
}

export function listMessages(): TeamChatMessage[] {
  return readAll().sort((a, b) => a.createdAt - b.createdAt)
}

export function addMessage(author: string, text: string): TeamChatMessage {
  const message: TeamChatMessage = {
    id: crypto.randomUUID(),
    author,
    text,
    createdAt: Date.now(),
  }
  writeAll([...readAll(), message])
  return message
}
