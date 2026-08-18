import { useState } from 'react'
import './UploadToolScreen.css'
import { downloadNotePdf } from '../lib/pdfGenerate'
import { listPatients, markPatientUploaded } from '../lib/patientStore'
import type { Patient } from '../lib/types'

interface Props {
  teamId: string
}

function UploadToolScreen({ teamId }: Props) {
  const [patients, setPatients] = useState<Patient[]>(() => listPatients(teamId).filter((p) => p.signed))

  function handleUpload(patient: Patient) {
    if (!patient.reworded) return
    downloadNotePdf(patient.name, patient.reworded)
    markPatientUploaded(patient.id)
    setPatients(listPatients(teamId).filter((p) => p.signed))
  }

  return (
    <div className="upload-tool-screen">
      <div className="upload-tool-header">
        <h1>Upload Tool</h1>
      </div>

      <p className="upload-tool-note">
        Signed notes only. "Upload" turns the note into a PDF and downloads it — from there it's a manual upload
        into PCC, since NOVA doesn't have a direct PCC connection.
      </p>

      {patients.length === 0 ? (
        <p className="upload-tool-empty">No signed notes yet — sign a note as Provider to see it here.</p>
      ) : (
        <ul className="upload-tool-list">
          {patients.map((p) => (
            <li key={p.id} className="upload-tool-item">
              <div className="upload-tool-item-info">
                <span className="upload-tool-item-name">{p.name}</span>
                <span className="upload-tool-item-meta">
                  Signed {p.signedAt ? new Date(p.signedAt).toLocaleString() : ''}
                </span>
              </div>
              <button type="button" className="btn btn-sm" onClick={() => handleUpload(p)}>
                Upload
              </button>
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

export default UploadToolScreen
