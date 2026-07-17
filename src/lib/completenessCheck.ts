export interface CompletenessResult {
  verdict: string
  missingItems: string[]
}

interface SectionCheck {
  label: string
  pattern: RegExp
}

const SECTION_CHECKS: SectionCheck[] = [
  { label: 'Subjective', pattern: /subjective|chief complaint|\bc\/o\b|patient reports|patient states|since last (eval|visit)/i },
  { label: 'Past Medical/Surgical History', pattern: /past medical|past surgical|\bpmh\b|\bpsh\b|surgical history/i },
  { label: 'Social History (EtOH, Tobacco, Drug use)', pattern: /social history|\betoh\b|tobacco|alcohol use|smoking|drug use/i },
  { label: 'Family History', pattern: /family history|\bfhx\b/i },
  { label: 'Allergies', pattern: /allerg|\bnkda\b/i },
  { label: 'Medications', pattern: /medication|current meds|home meds|med list/i },
  { label: 'Physical Exam findings', pattern: /physical exam|\bheent\b|vitals?[:\s]|cardio(vascular)?[:\s]|pulm(onary)?[:\s]|neuro(logical)?[:\s]|exam[:\s]/i },
  { label: 'Labs & Diagnostic Studies', pattern: /\blabs?\b|laboratory|imaging|x-?ray|\bmri\b|\bct\b ?scan|diagnostic stud/i },
  { label: 'Assessment/Plan with a problem list and plan items for each problem', pattern: /assessment|\ba\/p\b|plan[:\s]|problem list/i },
]

// Deterministic keyword scan — flags sections whose usual header/keywords
// aren't found anywhere in the source text, as things worth a second look.
// This is not a claim the section is actually missing, just a heuristic warning.
export function checkCompletenessLocal(text: string): CompletenessResult {
  const missingItems = SECTION_CHECKS.filter(({ pattern }) => !pattern.test(text)).map(({ label }) => label)

  const verdict =
    missingItems.length === 0
      ? 'Looks like all standard sections are represented in the source note.'
      : 'A few sections may be worth double-checking before finalizing.'

  return { verdict, missingItems }
}
