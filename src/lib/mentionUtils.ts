// Patient mentions are stored inline in the message text as
// @[Patient Name](patientId) — keeps a chat message a single string in
// storage while still letting the mention carry a stable patient id that
// survives the patient being renamed later.
const MENTION_PATTERN = /@\[([^\]]+)\]\(([^)]+)\)/g

export interface MentionToken {
  type: 'mention'
  name: string
  patientId: string
}

export interface TextToken {
  type: 'text'
  value: string
}

export type MessageToken = MentionToken | TextToken

export function encodeMention(name: string, patientId: string): string {
  return `@[${name}](${patientId})`
}

export function parseMessageTokens(text: string): MessageToken[] {
  const tokens: MessageToken[] = []
  let lastIndex = 0

  for (const match of text.matchAll(MENTION_PATTERN)) {
    const [full, name, patientId] = match
    const index = match.index ?? 0
    if (index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, index) })
    }
    tokens.push({ type: 'mention', name, patientId })
    lastIndex = index + full.length
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return tokens
}
