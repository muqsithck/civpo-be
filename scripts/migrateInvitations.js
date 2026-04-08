/**
 * Move legacy User.invitedMembers into Workspace.invitations for users with currentWorkspaceId.
 * Then $unset invitedMembers on users.
 *
 * Run: node scripts/migrateInvitations.js
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDb } from '../src/config/db.js'
import { Workspace } from '../src/models/Workspace.js'
import { User } from '../src/models/User.js'

async function main() {
  await connectDb()
  const usersCol = mongoose.connection.db.collection('users')
  const rawUsers = await usersCol.find({ invitedMembers: { $exists: true, $ne: [] } }).toArray()

  for (const raw of rawUsers) {
    const wid = raw.currentWorkspaceId
    if (!wid || !Array.isArray(raw.invitedMembers) || raw.invitedMembers.length === 0) {
      await usersCol.updateOne({ _id: raw._id }, { $unset: { invitedMembers: '' } })
      continue
    }

    const ws = await Workspace.findOne({ workspaceId: String(wid) })
    const inviter = await User.findById(raw._id)
    if (!ws || !inviter) {
      await usersCol.updateOne({ _id: raw._id }, { $unset: { invitedMembers: '' } })
      continue
    }

    for (const entry of raw.invitedMembers) {
      let email = String(entry.email ?? '').trim().toLowerCase()
      if (!email && entry.phone) {
        const p = String(entry.phone).replace(/\s/g, '')
        email = `legacy-${p}@migrated.invalid`
      }
      if (!email) continue
      const role = String(entry.role ?? 'member').toLowerCase()
      const invEnum = role === 'admin' || role === 'manager' ? 'ADMIN' : 'MEMBER'

      const exists = (ws.invitations ?? []).some(
        (i) => i.email === email && i.status === 'PENDING'
      )
      if (exists) continue

      ws.invitations.push({
        email,
        role: invEnum,
        status: 'PENDING',
        invitedBy: inviter._id,
        createdAt: new Date(),
      })
    }
    await ws.save()
    await usersCol.updateOne({ _id: raw._id }, { $unset: { invitedMembers: '' } })
  }

  console.log('[migrate] Invitation migration complete')
  await mongoose.disconnect()
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
