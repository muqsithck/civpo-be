import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { Workspace } from '../models/Workspace.js'
import { ensureMemberBootstrap } from '../lib/memberBootstrap.js'
import {
  listWorkspaceIdsForUser,
  getWorkspaceRoleForUser,
  findMemberSubdoc,
} from '../lib/workspaceMembership.js'
import { inviteEnumToMemberDbRole, defaultPermissionsForInviteMember } from '../lib/invitationHelpers.js'

const RESERVED_EMAILS = ['admin@demo.com', 'engineer@demo.com', 'superadmin@demo.com']

function signToken(user) {
  return jwt.sign(
    { sub: user.userId, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function workspaceToClient(ws) {
  if (!ws) return null
  return {
    id: ws.workspaceId,
    name: ws.name,
    email: ws.email,
    phone: ws.phone,
    place: ws.place,
    logo: ws.logo,
    companyCode: ws.companyCode,
  }
}

async function listWorkspacesForUser(userId) {
  const ids = await listWorkspaceIdsForUser(userId)
  if (ids.length === 0) return []
  const list = await Workspace.find({ workspaceId: { $in: ids } })
  const order = ['1', '2', '3']
  return list
    .map(workspaceToClient)
    .filter(Boolean)
    .sort((a, b) => {
      const ia = order.indexOf(a.id)
      const ib = order.indexOf(b.id)
      if (ia >= 0 && ib >= 0) return ia - ib
      if (ia >= 0) return -1
      if (ib >= 0) return 1
      return a.name.localeCompare(b.name)
    })
}

export async function register(req, res) {
  try {
    const name = String(req.body?.name ?? '').trim()
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const password = String(req.body?.password ?? '')

    if (RESERVED_EMAILS.includes(email)) {
      return res.status(400).json({ ok: false, error: 'This email is reserved for demo accounts' })
    }
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ ok: false, error: 'An account with this email already exists' })
    }
    if (password.length < 8) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters' })
    }

    const userId = `u-${Date.now()}`
    const passwordHash = await bcrypt.hash(password, 10)
    await User.create({
      userId,
      email,
      passwordHash,
      name,
    })

    return res.status(201).json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ ok: false, error: 'Registration failed' })
  }
}

export async function login(req, res) {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const password = String(req.body?.password ?? '')

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' })
    }
    const token = signToken(user)
    return res.json({
      ok: true,
      token,
      user: {
        id: user.userId,
        email: user.email,
        name: user.name,
      },
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ ok: false, error: 'Login failed' })
  }
}

export async function me(req, res) {
  try {
    const user = await User.findOne({ userId: req.userId })
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    let workspace = null
    /** Workspace-scoped role (snake_case), not account-level */
    let role = null
    if (user.currentWorkspaceId) {
      await ensureMemberBootstrap(user.currentWorkspaceId, user)
      const ws = await Workspace.findOne({ workspaceId: user.currentWorkspaceId })
      workspace = workspaceToClient(ws)
      role = await getWorkspaceRoleForUser(user.userId, user.currentWorkspaceId)
    }

    const workspaces = await listWorkspacesForUser(user.userId)

    return res.json({
      user: {
        id: user.userId,
        email: user.email,
        name: user.name,
      },
      workspace,
      role,
      roleOverride: user.roleOverride ?? null,
      workspaces,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to load session' })
  }
}

export async function patchMe(req, res) {
  try {
    const user = await User.findOne({ userId: req.userId })
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    const { roleOverride, currentWorkspaceId } = req.body ?? {}

    if (roleOverride !== undefined) {
      user.roleOverride = roleOverride
    }
    if (currentWorkspaceId !== undefined) {
      if (currentWorkspaceId === null) {
        user.currentWorkspaceId = null
      } else {
        const ws = await Workspace.findOne({ workspaceId: String(currentWorkspaceId) })
        if (!ws || !findMemberSubdoc(ws, user)) {
          return res.status(403).json({ error: 'Not a member of that workspace' })
        }
        user.currentWorkspaceId = String(currentWorkspaceId)
      }
    }

    await user.save()

    let workspace = null
    let role = null
    if (user.currentWorkspaceId) {
      await ensureMemberBootstrap(user.currentWorkspaceId, user)
      const ws = await Workspace.findOne({ workspaceId: user.currentWorkspaceId })
      workspace = workspaceToClient(ws)
      role = await getWorkspaceRoleForUser(user.userId, user.currentWorkspaceId)
    }

    const workspaces = await listWorkspacesForUser(user.userId)

    return res.json({
      user: {
        id: user.userId,
        email: user.email,
        name: user.name,
      },
      workspace,
      role,
      roleOverride: user.roleOverride ?? null,
      workspaces,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to update session' })
  }
}

export async function listMyInvitations(req, res) {
  try {
    const user = await User.findOne({ userId: req.userId })
    if (!user) return res.status(401).json({ error: 'User not found' })
    const email = user.email.toLowerCase()
    const workspaces = await Workspace.find({
      invitations: { $elemMatch: { email, status: 'PENDING' } },
    }).lean()

    const out = []
    for (const ws of workspaces) {
      for (const inv of ws.invitations ?? []) {
        if (inv.email === email && inv.status === 'PENDING') {
          out.push({
            invitationId: String(inv._id),
            workspaceId: ws.workspaceId,
            workspaceName: ws.name,
            role: inv.role,
            createdAt: inv.createdAt,
          })
        }
      }
    }
    return res.json(out)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to list invitations' })
  }
}

export async function acceptInvitation(req, res) {
  try {
    const user = await User.findOne({ userId: req.userId })
    if (!user) return res.status(401).json({ error: 'User not found' })
    const workspaceId = String(req.body?.workspaceId ?? '').trim()
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId required' })

    const ws = await Workspace.findOne({ workspaceId })
    if (!ws) return res.status(404).json({ error: 'Workspace not found' })

    const email = user.email.toLowerCase()
    const inv = ws.invitations?.find((i) => i.email === email && i.status === 'PENDING')
    if (!inv) return res.status(404).json({ error: 'No pending invitation for this workspace' })

    if (findMemberSubdoc(ws, user)) {
      inv.status = 'ACCEPTED'
      user.currentWorkspaceId = workspaceId
      await Promise.all([ws.save(), user.save()])
      return res.json({ ok: true, workspaceId, alreadyMember: true })
    }

    const dbRole = inviteEnumToMemberDbRole(inv.role)
    const perms = defaultPermissionsForInviteMember(inv.role)

    ws.members.push({
      user: user._id,
      role: dbRole,
      status: 'ACTIVE',
      name: user.name,
      email: user.email,
      permissions: perms,
      assignedProjectIds: [],
    })
    inv.status = 'ACCEPTED'
    user.currentWorkspaceId = workspaceId
    await Promise.all([ws.save(), user.save()])

    return res.json({ ok: true, workspaceId })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to accept invitation' })
  }
}
