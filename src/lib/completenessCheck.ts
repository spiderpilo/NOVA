export interface CompletenessResult {
  verdict: string
  missingItems: string[]
}

interface SectionCheck {
  label: string
  // Matches the note's own "## HEADING" line when the text follows the
  // structured skeleton (the AI output, or a user's edited version of it).
  heading: RegExp
  // Loose keyword fallback for unstructured text (e.g. the raw PDF extract,
  // which won't have markdown headings at all).
  keyword: RegExp
}

const SECTION_CHECKS: SectionCheck[] = [
  { label: 'Subjective', heading: /^##\s*SUBJECTIVE\s*$/im, keyword: /subjective|chief complaint|\bc\/o\b|patient reports|patient states|since last (eval|visit)/i },
  { label: 'Past Medical/Surgical History', heading: /^##\s*PAST MEDICAL\/SURGICAL HISTORY\s*$/im, keyword: /past medical|past surgical|\bpmh\b|\bpsh\b|surgical history/i },
  { label: 'Social History (EtOH, Tobacco, Drug use)', heading: /^##\s*SOCIAL HISTORY\s*$/im, keyword: /social history|\betoh\b|tobacco|alcohol use|smoking|drug use/i },
  { label: 'Family History', heading: /^##\s*FAMILY HISTORY\s*$/im, keyword: /family history|\bfhx\b/i },
  { label: 'Allergies', heading: /^##\s*ALLERGIES\s*$/im, keyword: /allerg|\bnkda\b/i },
  { label: 'Medications', heading: /^##\s*MEDICATIONS\s*$/im, keyword: /medication|current meds|home meds|med list/i },
  { label: 'Physical Exam findings', heading: /^##\s*PHYSICAL EXAM\s*$/im, keyword: /physical exam|\bheent\b|vitals?[:\s]|cardio(vascular)?[:\s]|pulm(onary)?[:\s]|neuro(logical)?[:\s]|exam[:\s]/i },
  { label: 'Labs & Diagnostic Studies', heading: /^##\s*LABS & DIAGNOSTIC STUDIES\s*$/im, keyword: /\blabs?\b|laboratory|imaging|x-?ray|\bmri\b|\bct\b ?scan|diagnostic stud/i },
  { label: 'Assessment/Plan with a problem list and plan items for each problem', heading: /^##\s*ASSESSMENT\/PLAN\s*$/im, keyword: /assessment|\ba\/p\b|plan[:\s]|problem list/i },
]

// Text between a "## HEADING" line and the next heading or "---" divider.
function sectionBody(text: string, heading: RegExp): string | null {
  const match = heading.exec(text)
  if (!match) return null
  const rest = text.slice(match.index + match[0].length)
  const nextMarker = /\n\s*(##\s|---)/.exec(rest)
  return (nextMarker ? rest.slice(0, nextMarker.index) : rest).trim()
}

// True if every line is blank, a bare bullet/label, or the "Not documented"
// placeholder the reword prompt writes for sections it found nothing for —
// i.e. the heading is present but nothing substantive follows it.
function isEffectivelyEmpty(body: string): boolean {
  return body.split('\n').every((line) => {
    const content = line
      .replace(/^[\s]*[-*]\s*/, '') // leading bullet
      .replace(/^\*\*[^*]+\*\*:?\s*/, '') // **Bold Label:**
      .replace(/^[A-Za-z /]+:\s*/, '') // Plain Label:
      .trim()
    return content === '' || /^not documented\.?$/i.test(content)
  })
}

// Flags sections that are either absent (no heading/keyword match at all —
// e.g. the raw unstructured source text) or present but empty/placeholder-only
// (the structured note has the heading with nothing real filled in below it).
// This is a heuristic warning, not a claim the section is actually missing.
export function checkCompletenessLocal(text: string): CompletenessResult {
  const missingItems = SECTION_CHECKS.filter(({ heading, keyword }) => {
    const body = sectionBody(text, heading)
    if (body !== null) return isEffectivelyEmpty(body)
    return !keyword.test(text)
  }).map(({ label }) => label)

  const verdict =
    missingItems.length === 0
      ? 'Looks like all standard sections are represented in the source note.'
      : 'A few sections may be worth double-checking before finalizing.'

  return { verdict, missingItems }
}
