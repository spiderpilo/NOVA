import { useState } from 'react'
import './PatientListScreen.css'
import { formatDateLabel, todayDateKey } from '../lib/dateUtils'
import { seedMockPatients } from '../lib/mockPatients'
import { createPatient, deletePatient, listPatients, signPatientNote, unsignPatientNote } from '../lib/patientStore'
import type { Patient } from '../lib/types'

export type PatientStatusFilter = 'noNote' | 'awaitingSignature'

// Both fields are optional and independent — a rounding-date click sets
// only `roundingDate` (every patient that day, whatever their status), a
// stat-tile click sets only `status` (every patient in that state, any
// day). Nothing currently combines both, but nothing stops a future entry
// point from doing so.
export interface PatientFilter {
  status?: PatientStatusFilter
  roundingDate?: string
}

const STATUS_LABELS: Record<PatientStatusFilter, string> = {
  noNote: 'No note yet',
  awaitingSignature: 'Awaiting provider signature',
}

interface Props {
  teamId: string
  canSign: boolean
  activePatientId: string | null
  initialFilter?: PatientFilter
  onSelect: (patient: Patient) => void
  onDelete: (id: string) => void
}

function matchesFilter(p: Patient, filter: PatientFilter): boolean {
  if (filter.roundingDate && p.roundingDate !== filter.roundingDate) return false
  if (filter.status === 'noNote' && p.reworded) return false
  if (filter.status === 'awaitingSignature' && !(p.reworded && !p.signed)) return false
  return true
}

function describeFilter(filter: PatientFilter): string {
  const parts: string[] = []
  if (filter.roundingDate) parts.push(formatDateLabel(filter.roundingDate))
  if (filter.status) parts.push(STATUS_LABELS[filter.status])
  return parts.join(' · ')
}

function PatientListScreen({ teamId, canSign, activePatientId, initialFilter = {}, onSelect, onDelete }: Props) {
  const [patients, setPatients] = useState<Patient[]>(() => listPatients(teamId))
  const [filter, setFilter] = useState<PatientFilter>(initialFilter)
  const [newName, setNewName] = useState('')
  const [newFacility, setNewFacility] = useState('')
  const [newRoundingDate, setNewRoundingDate] = useState(() => todayDateKey())
  // Armed by a first click on Delete; a second click on the same row
  // actually deletes. Only one row can be armed at a time.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  // Clicking a patient who already has a note in progress shows it here
  // instead of jumping into the full workspace — picking another patient
  // just replaces this. A patient with no note yet still opens the full
  // workspace directly, since there's nothing to preview. Initialized from
  // activePatientId so Back/Done from the full workspace lands back on a
  // preview of the same patient, rather than an empty pane — but only if
  // they actually have a note; a "no note yet" patient has nothing to show.
  const [previewPatient, setPreviewPatient] = useState<Patient | null>(() => {
    if (!activePatientId) return null
    const active = patients.find((p) => p.id === activePatientId)
    return active?.reworded ? active : null
  })

  const isFiltered = Boolean(filter.status || filter.roundingDate)
  const visiblePatients = patients.filter((p) => matchesFilter(p, filter))
  // A rounding-date click (not a status click) gets its own header treatment
  // — the date as the title, plus a home-page-style stat row scoped to just
  // that day's patients — rather than the generic "Patients" heading.
  const isDateView = Boolean(filter.roundingDate) && !filter.status
  const dateStats = {
    total: visiblePatients.length,
    noNoteYet: visiblePatients.filter((p) => !p.reworded).length,
    awaitingSignature: visiblePatients.filter((p) => p.reworded && !p.signed).length,
    needsUpload: visiblePatients.filter((p) => p.signed && !p.uploaded).length,
  }

  // Every other view (the full list, or a status-only filter) groups by
  // rounding date instead of one flat list — a provider scanning "Awaiting
  // signature" still wants to know which day each patient belongs to.
  // Patients within a date keep the list's existing most-recently-updated
  // order, since visiblePatients is already sorted that way.
  const groupsByDate = isDateView
    ? []
    : Array.from(
        visiblePatients.reduce((groups, p) => {
          const group = groups.get(p.roundingDate)
          if (group) group.push(p)
          else groups.set(p.roundingDate, [p])
          return groups
        }, new Map<string, Patient[]>()),
      ).sort(([a], [b]) => b.localeCompare(a))

  function handleCreate() {
    const name = newName.trim()
    const facility = newFacility.trim()
    if (!name || !facility) return
    createPatient(name, teamId, facility, newRoundingDate || todayDateKey())
    setPatients(listPatients(teamId))
    setNewName('')
    setNewFacility('')
    setNewRoundingDate(todayDateKey())
  }

  function handleDeleteClick(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    deletePatient(id)
    setPatients(listPatients(teamId))
    setConfirmDeleteId(null)
    if (previewPatient?.id === id) setPreviewPatient(null)
    onDelete(id)
  }

  function handleSeedMockPatients() {
    seedMockPatients(teamId)
    setPatients(listPatients(teamId))
  }

  // A provider has nothing to do in the full workspace for a patient with
  // no note yet — no note to review, nothing to sign — so they get the
  // preview's "Not available" state instead of an empty editor. A scribe
  // still opens the full workspace directly, since starting the note is
  // exactly what they'd go there to do.
  function handleRowClick(p: Patient) {
    if (p.reworded || canSign) {
      setPreviewPatient(p)
    } else {
      onSelect(p)
    }
  }

  function handleSign() {
    if (!previewPatient) return
    signPatientNote(previewPatient.id)
    setPreviewPatient({ ...previewPatient, signed: true, signedAt: Date.now() })
    setPatients(listPatients(teamId))
  }

  function handleUnsign() {
    if (!previewPatient) return
    unsignPatientNote(previewPatient.id)
    setPreviewPatient({ ...previewPatient, signed: false, signedAt: null })
    setPatients(listPatients(teamId))
  }

  function renderPatientRow(p: Patient) {
    const isActive = p.id === activePatientId || p.id === previewPatient?.id
    return (
      <li key={p.id} className={isActive ? 'patient-list-item patient-list-item-active' : 'patient-list-item'}>
        <button type="button" className="patient-list-item-select" onClick={() => handleRowClick(p)}>
          <span className="patient-list-item-name">{p.name}</span>
          <span className="patient-list-item-meta">
            <span
              className={
                p.reworded ? 'patient-list-item-note-status patient-list-item-note-status-has-note' : 'patient-list-item-note-status'
              }
            >
              {p.reworded ? 'Note in progress' : 'No note yet'}
            </span>{' '}
            · {formatDateLabel(p.roundingDate)} · {p.facility} · Updated {new Date(p.updatedAt).toLocaleString()}
          </span>
        </button>
        <div className="patient-list-item-actions">
          {p.reworded && (
            <span
              className={
                p.signed ? 'patient-list-item-status patient-list-item-status-signed' : 'patient-list-item-status patient-list-item-status-unsigned'
              }
            >
              {p.signed ? 'Signed' : 'Unsigned'}
            </span>
          )}
          {confirmDeleteId === p.id ? (
            <>
              <button type="button" className="btn btn-sm" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-sm patient-list-item-delete-confirm" onClick={() => handleDeleteClick(p.id)}>
                Confirm delete
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-sm patient-list-item-delete" onClick={() => handleDeleteClick(p.id)}>
              Delete
            </button>
          )}
        </div>
        {p.uploaded && (
          <div className="uploaded-fog">
            <span className="uploaded-fog-label">Uploaded</span>
          </div>
        )}
      </li>
    )
  }

  return (
    <div className="patient-list-screen">
      <div className="patient-list-main">
        <div className="patient-list-header">
          <h1>{isDateView ? formatDateLabel(filter.roundingDate ?? '') : 'Patients'}</h1>
        </div>

        {isDateView && (
          <div className="patient-list-date-stats">
            <div className="stat-tile">
              <span className="stat-tile-value">{dateStats.total}</span>
              <span className="stat-tile-label">Total patients</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-value">{dateStats.noNoteYet}</span>
              <span className="stat-tile-label">No note yet</span>
            </div>
            <div className="stat-tile stat-tile-warning">
              <span className="stat-tile-value">{dateStats.awaitingSignature}</span>
              <span className="stat-tile-label">Awaiting signature</span>
            </div>
            <div className="stat-tile stat-tile-warning">
              <span className="stat-tile-value">{dateStats.needsUpload}</span>
              <span className="stat-tile-label">Need to be uploaded</span>
            </div>
          </div>
        )}

        <p className="patient-list-note">
          Stored locally on this device for this test run — not yet synced to any shared or cloud storage.{' '}
          <button type="button" className="patient-list-seed-link" onClick={handleSeedMockPatients}>
            Add 15 mock patients
          </button>
        </p>

        {isFiltered && (
          <div className="patient-list-filter-banner">
            <span>
              {isDateView ? `${visiblePatients.length} patients` : `Showing: ${describeFilter(filter)} (${visiblePatients.length})`}
            </span>
            <button type="button" className="patient-list-seed-link" onClick={() => setFilter({})}>
              Show all patients
            </button>
          </div>
        )}

        <div className="patient-list-new">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
            placeholder="Patient name"
            className="patient-list-new-name"
          />
          <input
            type="text"
            value={newFacility}
            onChange={(e) => setNewFacility(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
            placeholder="Facility"
            className="patient-list-new-facility"
          />
          <input
            type="date"
            value={newRoundingDate}
            onChange={(e) => setNewRoundingDate(e.target.value)}
            className="patient-list-new-date"
          />
          <button type="button" className="btn" onClick={handleCreate} disabled={!newName.trim() || !newFacility.trim()}>
            Add Patient
          </button>
        </div>

        {visiblePatients.length === 0 ? (
          <p className="patient-list-empty">
            {isFiltered ? `No patients matching "${describeFilter(filter)}".` : 'No patients yet — add one above to get started.'}
          </p>
        ) : isDateView ? (
          <ul className="patient-list">{visiblePatients.map(renderPatientRow)}</ul>
        ) : (
          <div className="patient-list-groups">
            {groupsByDate.map(([date, group]) => (
              <div key={date} className="patient-list-group">
                <h2 className="patient-list-group-heading">
                  {formatDateLabel(date)}
                  <span className="patient-list-group-count">{group.length}</span>
                </h2>
                <ul className="patient-list">{group.map(renderPatientRow)}</ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="patient-list-preview">
        {previewPatient ? (
          <>
            <div className="patient-preview-header">
              <h2>{previewPatient.name}</h2>
              <span className="patient-preview-meta">
                {previewPatient.facility} · {formatDateLabel(previewPatient.roundingDate)}
              </span>
            </div>
            {previewPatient.reworded ? (
              <>
                <span
                  className={
                    previewPatient.signed
                      ? 'patient-list-item-status patient-list-item-status-signed'
                      : 'patient-list-item-status patient-list-item-status-unsigned'
                  }
                >
                  {previewPatient.signed
                    ? `Signed${previewPatient.signedAt ? ` on ${new Date(previewPatient.signedAt).toLocaleString()}` : ''}`
                    : 'Unsigned'}
                </span>
                <div className="patient-preview-text">{previewPatient.reworded}</div>
                <div className="patient-preview-actions">
                  <button type="button" className="btn btn-sm" onClick={() => onSelect(previewPatient)}>
                    Open full note
                  </button>
                  {canSign &&
                    (previewPatient.signed ? (
                      <button type="button" className="btn btn-sm" onClick={handleUnsign}>
                        Unsign
                      </button>
                    ) : (
                      <button type="button" className="btn" onClick={handleSign}>
                        Sign Note
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <p className="patient-preview-unavailable">Not available — no note has been started for this patient yet.</p>
            )}
          </>
        ) : (
          <p className="patient-preview-empty">Select a patient with a note in progress to preview it here.</p>
        )}
      </div>
    </div>
  )
}

export default PatientListScreen
