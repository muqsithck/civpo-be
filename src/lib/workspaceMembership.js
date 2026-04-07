import { User } from '../models/User.js'
import { Workspace } from '../models/Workspace.js'

/** DB-stored roles (uppercase) */
export const DB_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
}

/** Map legacy / client snake_case roles to DB enum */
export function toDbRole(clientRole) {
  if (!clientRole) return DB_ROLES.MEMBER
  const r = String(clientRole).toLowerCase()
  const map = {
    super_admin: DB_ROLES.SUPER_ADMIN,
    admin: DB_ROLES.ADMIN,
    manager: DB_ROLES.MANAGER,
    member: DB_ROLES.MEMBER,
    viewer: DB_ROLES.VIEWER,
    reporter: DB_ROLES.MEMBER,
  }
  return map[r] ?? DB_ROLES.MEMBER
}

/** API + frontend use snake_case */
export function toClientRole(dbRole) {
  if (!dbRole) return 'member'
  const map = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    MEMBER: 'member',
    VIEWER: 'viewer',
  }
  const key = String(dbRole).toUpperCase()
  return map[key] ?? 'member'
}

export async function getUserDocByUserId(userId) {
  if (!userId) return null
  return User.findOne({ userId: String(userId) })
}

export function findMemberSubdoc(ws, userDoc) {
  if (!ws?.members?.length || !userDoc?._id) return null
  const id = String(userDoc._id)
  return (
    ws.members.find((m) => {
      const mu = m.user?._id ?? m.user
      return mu && String(mu) === id
    }) ?? null
  )
}

/**
 * @returns {Promise<string | null>} client role (snake_case) for user in workspace
 */
export async function getWorkspaceRoleForUser(userIdString, workspaceId) {
  if (!workspaceId || !userIdString) return null
  const ws = await Workspace.findOne({ workspaceId }).lean()
  if (!ws) return null
  const userDoc = await getUserDocByUserId(userIdString)
  if (!userDoc) return null
  const m = findMemberSubdoc(ws, userDoc)
  return m ? toClientRole(m.role) : null
}

/**
 * List workspace ids where user is a member.
 */
export async function listWorkspaceIdsForUser(userIdString) {
  const userDoc = await getUserDocByUserId(userIdString)
  if (!userDoc) return []
  const list = await Workspace.find({
    'members.user': userDoc._id,
  })
    .select('workspaceId')
    .lean()
  return list.map((w) => w.workspaceId)
}

/** Normalize member subdoc to legacy WorkspaceMember-like shape for req + list API */
export function memberSubdocToApi(m, userDoc) {
  if (!m) return null
  const uid = userDoc?.userId ?? null
  return {
    userId: uid,
    id: uid,
    name: m.name ?? userDoc?.name ?? '',
    email: m.email ?? userDoc?.email ?? '',
    phone: m.phone ?? '',
    role: toClientRole(m.role),
    roleOverride: m.roleOverride ?? null,
    status: m.status ?? 'ACTIVE',
    permissions: m.permissions ?? {},
    assignedProjectIds: Array.isArray(m.assignedProjectIds) ? m.assignedProjectIds : [],
  }
}

export async function hydrateMemberForRequest(ws, userIdString) {
  const userDoc = await getUserDocByUserId(userIdString)
  if (!userDoc || !ws) return { userDoc: null, member: null, flat: null }
  const sub = findMemberSubdoc(ws, userDoc)
  const flat = memberSubdocToApi(sub, userDoc)
  return { userDoc, member: sub, flat }
}
