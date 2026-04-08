import { DB_ROLES } from './workspaceMembership.js'
import { getDefaultPermissions } from './roleDefaults.js'

/** Map team invite UI role (snake_case) to invitation enum ADMIN | MEMBER */
export function clientInviteRoleToEnum(clientRole) {
  const r = String(clientRole || 'member').toLowerCase()
  if (r === 'admin' || r === 'manager') return 'ADMIN'
  return 'MEMBER'
}

/** Member row role when invitation is accepted */
export function inviteEnumToMemberDbRole(invEnum) {
  return invEnum === 'ADMIN' ? DB_ROLES.ADMIN : DB_ROLES.MEMBER
}

export function defaultPermissionsForInviteMember(invEnum) {
  const client = invEnum === 'ADMIN' ? 'admin' : 'member'
  return getDefaultPermissions(client)
}
