import { useState } from 'react'
import './PatientListScreen.css'
import { createPatient, deletePatient, listPatients } from '../lib/patientStore'
import type { Patient } from '../lib/types'

interface Props {
  activePatientId: string | null
  onSelect: (patient: Patient) => void
  onDelete: (id: string) => void
  onHome: () => void
}

function PatientListScreen({ activePatientId, onSelect, onDelete, onHome }: Props) {
  const [patients, setPatients] = useState<Patient[]>(() => listPatients())
  const [newName, setNewName] = useState('')
  // Armed by a first click on Delete; a second click on the same row
  // actually deletes. Only one row can be armed at a time.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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

  return (
    <div className="patient-list-screen">
      <div className="patient-list-header">
        <h1>Patients</h1>
        <button type="button" className="btn btn-sm" onClick={onHome}>
          Home
        </button>
      </div>

      <p className="patient-list-note">
        Stored locally on this device for this test run — not yet synced to any shared or cloud storage.
      </p>

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

      {patients.length === 0 ? (
        <p className="patient-list-empty">No patients yet — add one above to get started.</p>
      ) : (
        <ul className="patient-list">
          {patients.map((p) => (
            <li
              key={p.id}
              className={p.id === activePatientId ? 'patient-list-item patient-list-item-active' : 'patient-list-item'}
            >
              <button type="button" className="patient-list-item-select" onClick={() => onSelect(p)}>
                <span className="patient-list-item-name">{p.name}</span>
                <span className="patient-list-item-meta">
                  {p.reworded ? 'Note in progress' : 'No note yet'} · Updated {new Date(p.updatedAt).toLocaleString()}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default PatientListScreen
