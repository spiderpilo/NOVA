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
  // Clicking a row previews the note here instead of only offering the
  // Upload button blind — picking another patient just replaces it.
  const [previewPatient, setPreviewPatient] = useState<Patient | null>(null)

  function handleUpload(patient: Patient) {
    if (!patient.reworded) return
    downloadNotePdf(patient.name, patient.reworded)
    markPatientUploaded(patient.id)
    setPatients(listPatients(teamId).filter((p) => p.signed))
    if (previewPatient?.id === patient.id) {
      setPreviewPatient({ ...patient, uploaded: true, uploadedAt: Date.now() })
    }
  }

  return (
    <div className="upload-tool-screen">
      <div className="upload-tool-main">
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
              <li
                key={p.id}
                className={p.id === previewPatient?.id ? 'upload-tool-item upload-tool-item-active' : 'upload-tool-item'}
              >
                <button type="button" className="upload-tool-item-select" onClick={() => setPreviewPatient(p)}>
                  <span className="upload-tool-item-name">{p.name}</span>
                  <span className="upload-tool-item-meta">
                    Signed {p.signedAt ? new Date(p.signedAt).toLocaleString() : ''}
                  </span>
                </button>
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

      <div className="upload-tool-preview">
        {previewPatient ? (
          <>
            <div className="upload-preview-header">
              <h2>{previewPatient.name}</h2>
              <span className="upload-preview-meta">
                Signed {previewPatient.signedAt ? new Date(previewPatient.signedAt).toLocaleString() : ''}
              </span>
            </div>
            <div className="upload-preview-text">{previewPatient.reworded}</div>
            <div className="upload-preview-actions">
              <button type="button" className="btn" onClick={() => handleUpload(previewPatient)}>
                {previewPatient.uploaded ? 'Re-upload' : 'Upload'}
              </button>
            </div>
          </>
        ) : (
          <p className="upload-preview-empty">Select a patient to preview their note here.</p>
        )}
      </div>
    </div>
  )
}

export default UploadToolScreen
