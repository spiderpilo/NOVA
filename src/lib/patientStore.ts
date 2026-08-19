import { dateKey, todayDateKey } from './dateUtils'
import { listTeamMembers } from './teamStore'
import type { NoteType, Patient } from './types'

// localStorage rather than sessionStorage — patients need to survive a tab
// close, unlike the single-document autosave in App.tsx. This is a local
// test-run stand-in; a real deployment would back this with a server.
const PATIENTS_KEY = 'nova:patients'

// Patients saved before team scoping existed have no teamId — split them
// round-robin across the seeded providers so an existing test run still
// demonstrates per-team scoping instead of every legacy patient silently
// disappearing from every team's list.
function backfillTeamId(patients: Patient[]): Patient[] {
  if (patients.every((p) => p.teamId)) return patients
  const providers = listTeamMembers().filter((m) => m.role === 'provider')
  if (providers.length === 0) return patients
  let index = 0
  return patients.map((p) => {
    if (p.teamId) return p
    const provider = providers[index % providers.length]
    index += 1
    return { ...p, teamId: provider.id }
  })
}

function readAll(): Patient[] {
  try {
    const raw = localStorage.getItem(PATIENTS_KEY)
    if (!raw) return []
    const patients = JSON.parse(raw) as Patient[]
    // Backfill for patients saved before roundingDate existed — without
    // this, formatDateLabel() throws on the missing field and blanks the
    // whole page, since nothing here has an error boundary. Best guess is
    // their creation date, since that's the closest thing to "which day's
    // rounds they were part of" for a record that predates the concept.
    const withRoundingDate = patients.map((p) =>
      p.roundingDate ? p : { ...p, roundingDate: dateKey(new Date(p.createdAt)) },
    )
    const withFacility = withRoundingDate.map((p) => (p.facility ? p : { ...p, facility: 'Unspecified facility' }))
    return backfillTeamId(withFacility)
  } catch {
    return []
  }
}

function writeAll(patients: Patient[]) {
  try {
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients))
  } catch {
    // best-effort — localStorage may be unavailable (private browsing, quota)
  }
}

export function listPatients(teamId: string): Patient[] {
  return readAll()
    .filter((p) => p.teamId === teamId)
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getPatientById(id: string): Patient | null {
  return readAll().find((p) => p.id === id) ?? null
}

// roundingDate defaults to today — a patient added through the normal "Add
// Patient" flow is added as part of today's rounds. Mock/seed data passes
// an explicit past date to backfill a realistic rounding-date history.
export function createPatient(
  name: string,
  teamId: string,
  facility: string,
  roundingDate: string = todayDateKey(),
): Patient {
  const now = Date.now()
  const patient: Patient = {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    noteType: 'initial',
    extractedText: null,
    reworded: null,
    signed: false,
    signedAt: null,
    uploaded: false,
    uploadedAt: null,
    roundingDate,
    teamId,
    facility,
  }
  writeAll([...readAll(), patient])
  return patient
}

export function updatePatientNote(
  id: string,
  data: {
    noteType: NoteType
    extractedText: string | null
    reworded: string | null
    signed: boolean
    signedAt: number | null
  },
): void {
  const patients = readAll()
  const index = patients.findIndex((p) => p.id === id)
  if (index === -1) return
  patients[index] = { ...patients[index], ...data, updatedAt: Date.now() }
  writeAll(patients)
}

export function deletePatient(id: string): void {
  writeAll(readAll().filter((p) => p.id !== id))
}

// Marks a note as pulled into a PDF for manual upload to PCC — doesn't
// touch the note content itself, just the upload status shown across the
// patient list screens.
export function markPatientUploaded(id: string): void {
  const patients = readAll()
  const index = patients.findIndex((p) => p.id === id)
  if (index === -1) return
  patients[index] = { ...patients[index], uploaded: true, uploadedAt: Date.now() }
  writeAll(patients)
}

export interface RoundingDateSummary {
  date: string
  total: number
  complete: number
}

// A rounding date is "complete" once every patient seen that day has a
// note, a provider signature, and an upload — the full pipeline, not just
// one stage of it. Sorted newest-first, since a provider opening this is
// almost always checking on today's or yesterday's rounds first.
export function listRoundingDates(teamId: string): RoundingDateSummary[] {
  const byDate = new Map<string, Patient[]>()
  for (const p of readAll().filter((p) => p.teamId === teamId)) {
    const group = byDate.get(p.roundingDate) ?? []
    group.push(p)
    byDate.set(p.roundingDate, group)
  }
  return Array.from(byDate.entries())
    .map(([date, group]) => ({
      date,
      total: group.length,
      complete: group.filter((p) => p.reworded && p.signed && p.uploaded).length,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}
