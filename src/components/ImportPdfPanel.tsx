import { useRef, useState } from 'react'
import { extractTextFromPdf, PdfExtractError } from '../lib/pdfExtract'
import './ImportPdfPanel.css'

type Status = 'idle' | 'extracting' | 'error' | 'done'

interface Props {
  onExtracted: (text: string) => void
}

function ImportPdfPanel({ onExtracted }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setFileName(file.name)
    setStatus('extracting')
    setError(null)

    try {
      const text = await extractTextFromPdf(file)
      setStatus('done')
      onExtracted(text)
    } catch (err) {
      setStatus('error')
      setError(err instanceof PdfExtractError ? err.message : 'Failed to read the PDF.')
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
  }

  return (
    <section className="panel">
      <h2>Import PDF</h2>
      <div className="panel-content import-pdf-content">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleChange}
          className="import-pdf-input"
        />
        <button type="button" className="import-pdf-button" onClick={() => inputRef.current?.click()}>
          Choose PDF
        </button>

        {fileName && <p className="import-pdf-filename">{fileName}</p>}

        {status === 'extracting' && <p className="import-pdf-status">Extracting text…</p>}
        {status === 'error' && error && <p className="import-pdf-error">{error}</p>}
        {status === 'done' && <p className="import-pdf-status">Text extracted. Rewording…</p>}
      </div>
    </section>
  )
}

export default ImportPdfPanel
