import { createPatient, markPatientUploaded, updatePatientNote } from './patientStore'

// Fictional names for demo/test purposes only.
const MOCK_NAMES = [
  'Alice Turner',
  'Marcus Bell',
  'Priya Nair',
  'James O’Connor',
  'Fatima Ali',
  'Robert Chen',
  'Linda Garcia',
  'David Kim',
  'Sophia Rossi',
  'Michael Brown',
  'Emma Wilson',
  'Carlos Mendez',
  'Grace Park',
  'Daniel Foster',
  'Olivia Martin',
]

function mockNoteText(name: string): string {
  return `# PHYSICAL MEDICINE AND REHABILITATION CONSULTATION

---

## HISTORY OF PRESENT ILLNESS
${name} presents for follow-up regarding ongoing rehabilitation progress. Reports gradual improvement in function and pain control with the current therapy plan.

---

## ASSESSMENT/PLAN
Continue current physical therapy regimen. Follow up in 4 weeks to reassess progress.`
}

// Seeds a mix of patient states — no note, unsigned note, signed note, and
// signed+uploaded — so the Patients screen and home-page stats have
// something realistic to show without needing to click through the full
// import/reword/sign flow 15 times by hand.
export function seedMockPatients(): void {
  MOCK_NAMES.forEach((name, i) => {
    const patient = createPatient(name)
    const bucket = i % 4
    if (bucket === 0) return // no note yet

    const noteText = mockNoteText(name)
    const signed = bucket >= 2
    updatePatientNote(patient.id, {
      noteType: 'initial',
      extractedText: noteText,
      reworded: noteText,
      signed,
      signedAt: signed ? Date.now() : null,
    })

    if (bucket === 3) {
      markPatientUploaded(patient.id)
    }
  })
}
