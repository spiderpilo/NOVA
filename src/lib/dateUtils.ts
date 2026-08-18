// Local (not UTC) calendar-day key — two patients "rounded" on the same
// day should group together regardless of what time they were touched.
export function dateKey(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayDateKey(): string {
  return dateKey(new Date())
}

export function daysAgoDateKey(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return dateKey(d)
}

// "Aug 15, 2026" — with a "Today"/"Yesterday" suffix when it applies, since
// that's what a provider actually scans for in a rounding-date list.
export function formatDateLabel(key: string): string {
  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

  if (key === todayDateKey()) return `${label} (Today)`
  if (key === daysAgoDateKey(1)) return `${label} (Yesterday)`
  return label
}
