import { useState } from 'react'
import './PatientListScreen.css'
import { formatDateLabel } from '../lib/dateUtils'
import { seedMockPatients } from '../lib/mockPatients'
import { createPatient, deletePatient, listPatients } from '../lib/patientStore'
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

function PatientListScreen({ teamId, activePatientId, initialFilter = {}, onSelect, onDelete }: Props) {
  const [patients, setPatients] = useState<Patient[]>(() => listPatients(teamId))
  const [filter, setFilter] = useState<PatientFilter>(initialFilter)
  const [newName, setNewName] = useState('')
  // Armed by a first click on Delete; a second click on the same row
  // actually deletes. Only one row can be armed at a time.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    createPatient(name, teamId)
    setPatients(listPatients(teamId))
    setNewName('')
  }

  function handleDeleteClick(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    deletePatient(id)
    setPatients(listPatients(teamId))
    setConfirmDeleteId(null)
    onDelete(id)
  }

  function handleSeedMockPatients() {
    seedMockPatients(teamId)
    setPatients(listPatients(teamId))
  }

  return (
    <div className="patient-list-screen">
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
          placeholder="New patient name"
        />
        <button type="button" className="btn" onClick={handleCreate} disabled={!newName.trim()}>
          Add Patient
        </button>
      </div>

      {visiblePatients.length === 0 ? (
        <p className="patient-list-empty">
          {isFiltered ? `No patients matching "${describeFilter(filter)}".` : 'No patients yet — add one above to get started.'}
        </p>
      ) : (
        <ul className="patient-list">
          {visiblePatients.map((p) => (
            <li
              key={p.id}
              className={p.id === activePatientId ? 'patient-list-item patient-list-item-active' : 'patient-list-item'}
            >
              <button type="button" className="patient-list-item-select" onClick={() => onSelect(p)}>
                <span className="patient-list-item-name">{p.name}</span>
                <span className="patient-list-item-meta">
                  <span
                    className={
                      p.reworded ? 'patient-list-item-note-status patient-list-item-note-status-has-note' : 'patient-list-item-note-status'
                    }
                  >
                    {p.reworded ? 'Note in progress' : 'No note yet'}
                  </span>{' '}
                  · {formatDateLabel(p.roundingDate)} · Updated {new Date(p.updatedAt).toLocaleString()}
                </span>
              </button>
              <div className="patient-list-item-actions">
                {p.reworded && (
                  <span
                    className={
                      p.signed
                        ? 'patient-list-item-status patient-list-item-status-signed'
                        : 'patient-list-item-status patient-list-item-status-unsigned'
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
                    <button
                      type="button"
                      className="btn btn-sm patient-list-item-delete-confirm"
                      onClick={() => handleDeleteClick(p.id)}
                    >
                      Confirm delete
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm patient-list-item-delete"
                    onClick={() => handleDeleteClick(p.id)}
                  >
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
          ))}
        </ul>
      )}
    </div>
  )
}

export default PatientListScreen
