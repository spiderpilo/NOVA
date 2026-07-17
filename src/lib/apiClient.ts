import type { ApiErrorResponse, RewordResponse } from './types'

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

export function rewordText(text: string): Promise<string> {
  return postJson<RewordResponse>('/api/reword', { text }).then((r) => r.reworded)
}
