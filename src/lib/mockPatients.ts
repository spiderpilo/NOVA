import { daysAgoDateKey } from './dateUtils'
import { createPatient, markPatientUploaded, updatePatientNote } from './patientStore'

type MockState = 'noNote' | 'unsigned' | 'signedNotUploaded' | 'complete'

interface MockPatientSpec {
  name: string
  daysAgo: number
  state: MockState
}

// Fictional names and a hand-picked spread across 4 rounding dates, so the
// home page's rounding-date list tells a coherent story: older rounds are
// further along than today's, the way a real clinic's backlog actually
// looks — instead of every date having the same random mix.
const MOCK_PATIENTS: MockPatientSpec[] = [
  // 3 days ago — fully wrapped up.
  { name: 'Alice Turner', daysAgo: 3, state: 'complete' },
  { name: 'Marcus Bell', daysAgo: 3, state: 'complete' },
  { name: 'Priya Nair', daysAgo: 3, state: 'complete' },
  { name: 'James O’Connor', daysAgo: 3, state: 'complete' },
  // 2 days ago — nearly done, one still needs uploading.
  { name: 'Fatima Ali', daysAgo: 2, state: 'complete' },
  { name: 'Robert Chen', daysAgo: 2, state: 'complete' },
  { name: 'Linda Garcia', daysAgo: 2, state: 'complete' },
  { name: 'David Kim', daysAgo: 2, state: 'signedNotUploaded' },
  // Yesterday — still mostly in progress.
  { name: 'Sophia Rossi', daysAgo: 1, state: 'complete' },
  { name: 'Michael Brown', daysAgo: 1, state: 'signedNotUploaded' },
  { name: 'Emma Wilson', daysAgo: 1, state: 'unsigned' },
  { name: 'Carlos Mendez', daysAgo: 1, state: 'noNote' },
  // Today — just getting started.
  { name: 'Grace Park', daysAgo: 0, state: 'noNote' },
  { name: 'Daniel Foster', daysAgo: 0, state: 'noNote' },
  { name: 'Olivia Martin', daysAgo: 0, state: 'unsigned' },
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

// Seeds a realistic spread of patients — no note, unsigned note, signed but
// not uploaded, and fully complete — across 4 rounding dates, so the
// Patients screen and home-page stats/rounding-date list have something
// real to show without clicking through the full flow 15 times by hand.
export function seedMockPatients(teamId: string): void {
  for (const spec of MOCK_PATIENTS) {
    const patient = createPatient(spec.name, teamId, daysAgoDateKey(spec.daysAgo))
    if (spec.state === 'noNote') continue

    const noteText = mockNoteText(spec.name)
    const signed = spec.state === 'signedNotUploaded' || spec.state === 'complete'
    updatePatientNote(patient.id, {
      noteType: 'initial',
      extractedText: noteText,
      reworded: noteText,
      signed,
      signedAt: signed ? Date.now() : null,
    })

    if (spec.state === 'complete') {
      markPatientUploaded(patient.id)
    }
  }
}
