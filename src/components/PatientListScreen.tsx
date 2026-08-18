import { useState } from 'react'
import './PatientListScreen.css'
import { seedMockPatients } from '../lib/mockPatients'
import { createPatient, deletePatient, listPatients } from '../lib/patientStore'
import type { Patient } from '../lib/types'

export type PatientFilter = 'all' | 'noNote' | 'awaitingSignature'

const FILTER_LABELS: Record<Exclude<PatientFilter, 'all'>, string> = {
  noNote: 'No note yet',
  awaitingSignature: 'Awaiting provider signature',
}

interface Props {
  activePatientId: string | null
  initialFilter?: PatientFilter
  onSelect: (patient: Patient) => void
  onDelete: (id: string) => void
}

function matchesFilter(p: Patient, filter: PatientFilter): boolean {
  if (filter === 'noNote') return !p.reworded
  if (filter === 'awaitingSignature') return Boolean(p.reworded) && !p.signed
  return true
}

function PatientListScreen({ activePatientId, initialFilter = 'all', onSelect, onDelete }: Props) {
  const [patients, setPatients] = useState<Patient[]>(() => listPatients())
  const [filter, setFilter] = useState<PatientFilter>(initialFilter)
  const [newName, setNewName] = useState('')
  // Armed by a first click on Delete; a second click on the same row
  // actually deletes. Only one row can be armed at a time.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const visiblePatients = patients.filter((p) => matchesFilter(p, filter))

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    createPatient(name)
    setPatients(listPatients())
    setNewName('')
  }

  function handleDeleteClick(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    deletePatient(id)
    setPatients(listPatients())
    setConfirmDeleteId(null)
    onDelete(id)
  }

  function handleSeedMockPatients() {
    seedMockPatients()
    setPatients(listPatients())
  }

  return (
    <div className="patient-list-screen">
      <div className="patient-list-header">
        <h1>Patients</h1>
      </div>

      <p className="patient-list-note">
        Stored locally on this device for this test run — not yet synced to any shared or cloud storage.{' '}
        <button type="button" className="patient-list-seed-link" onClick={handleSeedMockPatients}>
          Add 15 mock patients
        </button>
      </p>

      {filter !== 'all' && (
        <div className="patient-list-filter-banner">
          <span>
            Showing: {FILTER_LABELS[filter]} ({visiblePatients.length})
          </span>
          <button type="button" className="patient-list-seed-link" onClick={() => setFilter('all')}>
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
          {filter === 'all'
            ? 'No patients yet — add one above to get started.'
            : `No patients matching "${FILTER_LABELS[filter as Exclude<PatientFilter, 'all'>]}".`}
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
                  · Updated {new Date(p.updatedAt).toLocaleString()}
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
