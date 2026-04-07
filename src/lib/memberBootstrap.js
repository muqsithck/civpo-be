import { Workspace } from '../models/Workspace.js'
import { getDefaultPermissions } from '../lib/roleDefaults.js'
import { findMemberSubdoc, toDbRole, getUserDocByUserId } from './workspaceMembership.js'

function inferDemoCompanyRole(workspaceId, email) {
  if (workspaceId !== '1' || !email) return null
  const e = String(email).toLowerCase()
  if (e === 'admin@demo.com' || e === 'superadmin@demo.com') return 'super_admin'
  if (e === 'engineer@demo.com') return 'member'
  return null
}

/**
 * Ensures the user has a roster row for this workspace (embedded members).
 */
export async function ensureMemberBootstrap(workspaceId, user) {
  if (!workspaceId || !user?.userId) return

  const userDoc = user._id ? user : await getUserDocByUserId(user.userId)
  if (!userDoc?._id) return

  const ws = await Workspace.findOne({ workspaceId })
  if (!ws) return

  const existing = findMemberSubdoc(ws, userDoc)
  if (existing) return

  const demo = inferDemoCompanyRole(workspaceId, user.email)
  const ownerId = ws.ownerUserId
  const clientRole = demo ?? (ownerId === user.userId ? 'super_admin' : 'member')
  const dbRole = toDbRole(clientRole)
  const perms = getDefaultPermissions(clientRole)

  ws.members.push({
    user: userDoc._id,
    role: dbRole,
    status: 'ACTIVE',
    name: user.name ?? user.email,
    email: user.email,
    permissions: perms,
    assignedProjectIds: [],
  })
  await ws.save()
}
