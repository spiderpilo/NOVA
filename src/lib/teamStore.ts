import type { Role, TeamMember } from './types'

// localStorage — same test-run stand-in pattern as patientStore.ts and
// chatStore.ts, not a real backend/directory.
const TEAM_KEY = 'nova:team'

function readAll(): TeamMember[] {
  try {
    const raw = localStorage.getItem(TEAM_KEY)
    return raw ? (JSON.parse(raw) as TeamMember[]) : []
  } catch {
    return []
  }
}

function writeAll(members: TeamMember[]) {
  try {
    localStorage.setItem(TEAM_KEY, JSON.stringify(members))
  } catch {
    // best-effort — localStorage may be unavailable (private browsing, quota)
  }
}

// A roster with nobody on it doesn't read as a real page on first visit,
// so — unlike patients, which realistically start empty — the team seeds
// itself once automatically rather than needing an explicit "add mock
// data" click.
function seedIfEmpty(): void {
  if (readAll().length > 0) return
  const patelId = crypto.randomUUID()
  const bellId = crypto.randomUUID()
  writeAll([
    { id: patelId, name: 'Dr. Sarah Patel', role: 'provider', supervisorId: null },
    { id: bellId, name: 'Dr. Marcus Bell', role: 'provider', supervisorId: null },
    { id: crypto.randomUUID(), name: 'Alex Kim', role: 'scribe', supervisorId: patelId },
    { id: crypto.randomUUID(), name: 'Jordan Lee', role: 'scribe', supervisorId: patelId },
    { id: crypto.randomUUID(), name: 'Taylor Nguyen', role: 'scribe', supervisorId: bellId },
  ])
}

export function listTeamMembers(): TeamMember[] {
  seedIfEmpty()
  return readAll()
}

export function addTeamMember(name: string, role: Role, supervisorId: string | null): TeamMember {
  seedIfEmpty()
  const member: TeamMember = {
    id: crypto.randomUUID(),
    name,
    role,
    supervisorId: role === 'scribe' ? supervisorId : null,
  }
  writeAll([...readAll(), member])
  return member
}
