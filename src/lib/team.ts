import type { TeamMember } from './types'

// A provider's team is themselves plus their scribes, so a provider is
// their own teamId while a scribe's teamId is whoever supervises them.
export function resolveTeamId(member: TeamMember): string {
  return member.role === 'provider' ? member.id : (member.supervisorId ?? member.id)
}
