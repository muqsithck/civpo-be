/**
 * One-time migration:
 * 1) Copy WorkspaceMember documents into Workspace.members (embedded)
 * 2) Drop workspacemembers collection
 * 3) For users with legacy `role` field, ensure membership in currentWorkspace and $unset role
 *
 * Run from backend: node scripts/migrateWorkspaceRoles.js
 * Requires MONGO_URI in .env
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDb } from '../src/config/db.js'
import { Workspace } from '../src/models/Workspace.js'
import { User } from '../src/models/User.js'
import { toDbRole, findMemberSubdoc } from '../src/lib/workspaceMembership.js'
import { getDefaultPermissions } from '../src/lib/roleDefaults.js'

function mapLegacyAccountRoleToClient(raw) {
  if (!raw) return 'member'
  const r = String(raw).toLowerCase()
  if (r === 'super_admin' || r === 'super admin') return 'super_admin'
  if (r === 'admin') return 'admin'
  return 'member'
}

async function migrateWorkspaceMembersCollection() {
  const db = mongoose.connection.db
  const names = await db.listCollections().toArray()
  const hasWM = names.some((n) => n.name === 'workspacemembers')
  if (!hasWM) {
    console.log('[migrate] No workspacemembers collection')
    return
  }
  const coll = db.collection('workspacemembers')
  const count = await coll.countDocuments()
  if (count === 0) {
    console.log('[migrate] workspacemembers empty')
    await coll.drop().catch(() => {})
    return
  }
  const members = await coll.find({}).toArray()
  for (const wm of members) {
    const ws = await Workspace.findOne({ workspaceId: wm.workspaceId })
    const user = await User.findOne({ userId: wm.userId })
    if (!ws || !user) {
      console.warn('[migrate] Skip orphaned WM:', wm.workspaceId, wm.userId)
      continue
    }
    if (findMemberSubdoc(ws, user)) continue
    ws.members.push({
      user: user._id,
      role: toDbRole(wm.role),
      roleOverride: wm.roleOverride ?? null,
      status: wm.status ?? 'ACTIVE',
      name: wm.name,
      email: wm.email,
      phone: wm.phone,
      permissions: wm.permissions ?? {},
      assignedProjectIds: wm.assignedProjectIds ?? [],
    })
    await ws.save()
  }
  await coll.drop()
  console.log('[migrate] Migrated workspacemembers → Workspace.members and dropped collection')
}

async function migrateLegacyUserRoleField() {
  const usersCol = mongoose.connection.db.collection('users')
  const rawUsers = await usersCol.find({ role: { $exists: true } }).toArray()
  for (const raw of rawUsers) {
    const u = await User.findById(raw._id)
    if (!u) continue
    const legacyRole = raw.role
    const workspaceId = u.currentWorkspaceId
    if (workspaceId && legacyRole !== undefined && legacyRole !== null) {
      const ws = await Workspace.findOne({ workspaceId })
      if (ws && !findMemberSubdoc(ws, u)) {
        const clientRole = mapLegacyAccountRoleToClient(legacyRole)
        ws.members.push({
          user: u._id,
          role: toDbRole(clientRole),
          status: 'ACTIVE',
          name: u.name,
          email: u.email,
          permissions: getDefaultPermissions(clientRole),
          assignedProjectIds: [],
        })
        await ws.save()
      }
    }
    await usersCol.updateOne({ _id: raw._id }, { $unset: { role: '' } })
  }
  console.log('[migrate] Unset legacy user.role where present')
}

async function main() {
  await connectDb()
  await migrateWorkspaceMembersCollection()
  await migrateLegacyUserRoleField()
  await mongoose.disconnect()
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
