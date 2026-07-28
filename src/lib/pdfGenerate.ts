import { jsPDF } from 'jspdf'

// Dumps a signed note's text into a plain, readable PDF and triggers a
// browser download — the output is meant to be manually uploaded into PCC,
// not submitted through any API (NOVA has no PCC integration).
export function downloadNotePdf(patientName: string, noteText: string): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const margin = 54
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const usableWidth = pageWidth - margin * 2
  const lineHeight = 14

  let y = margin
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(patientName, margin, y)
  y += lineHeight * 1.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  const lines: string[] = doc.splitTextToSize(noteText, usableWidth)

  for (const line of lines) {
    if (y > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
    doc.text(line, margin, y)
    y += lineHeight
  }

  const safeName = patientName.trim().replace(/[^a-z0-9]+/gi, '_') || 'patient'
  doc.save(`${safeName}_note.pdf`)
}
