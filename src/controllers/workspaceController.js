import { Workspace } from '../models/Workspace.js'
import { Project } from '../models/Project.js'
import { User } from '../models/User.js'
import { generateUniqueCompanyCode, findWorkspaceByJoinCode } from '../lib/companyCode.js'
import { getDefaultPermissions } from '../lib/roleDefaults.js'
import { ensureMemberBootstrap } from '../lib/memberBootstrap.js'
import {
  toDbRole,
  toClientRole,
  memberSubdocToApi,
  findMemberSubdoc,
  getUserDocByUserId,
} from '../lib/workspaceMembership.js'
import { clientInviteRoleToEnum } from '../lib/invitationHelpers.js'
import { ensureWorkspaceSettings } from '../services/seedSettings.js'
import { logActivity } from '../services/audit.service.js'
import { resolveActor } from '../lib/auditActor.js'
import { ENTITY_TYPES, AUDIT_ACTIONS } from '../config/auditConstants.js'

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

async function membersToClientList(ws) {
  if (!ws?.members?.length) return []
  const ids = ws.members.map((m) => m.user)
  const users = await User.find({ _id: { $in: ids } }).lean()
  const byId = new Map(users.map((u) => [String(u._id), u]))
  const out = []
  for (const m of ws.members) {
    const u = byId.get(String(m.user))
    if (!u) continue
    out.push(memberSubdocToApi(m, u))
  }
  return out
}

export async function createWorkspace(req, res) {
  try {
    const { name, email, phone, place, logo } = req.body ?? {}
    if (!String(name ?? '').trim()) {
      return res.status(400).json({ ok: false, error: 'Company name is required' })
    }

    const user = await User.findOne({ userId: req.userId })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const companyCode = await generateUniqueCompanyCode()
    const workspaceId = `ws-${Date.now()}`
    const dbRole = toDbRole('super_admin')

    await Workspace.create({
      workspaceId,
      name: String(name).trim(),
      email: email ? String(email).trim() : undefined,
      phone: phone ? String(phone).trim() : undefined,
      place: place ? String(place).trim() : undefined,
      logo: logo || undefined,
      companyCode,
      ownerUserId: user.userId,
      createdBy: user._id,
      members: [
        {
          user: user._id,
          role: dbRole,
          roleOverride: 'super_admin',
          status: 'ACTIVE',
          name: user.name ?? user.email,
          email: user.email,
          permissions: getDefaultPermissions('super_admin'),
          assignedProjectIds: [],
        },
      ],
    })

    user.currentWorkspaceId = workspaceId
    await user.save()

    await ensureWorkspaceSettings(workspaceId)

    const ws = await Workspace.findOne({ workspaceId })
    return res.status(201).json({ ok: true, workspace: workspaceToClient(ws) })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ ok: false, error: 'Failed to create company' })
  }
}

export async function joinWorkspace(req, res) {
  try {
    const code = String(req.body?.code ?? '').trim()
    const ws = await findWorkspaceByJoinCode(code)
    if (!ws) {
      return res.status(400).json({ ok: false, error: 'Invalid company code' })
    }

    const user = await User.findOne({ userId: req.userId })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    await ensureMemberBootstrap(ws.workspaceId, user)

    user.currentWorkspaceId = ws.workspaceId
    await user.save()

    return res.json({ ok: true, workspace: workspaceToClient(ws) })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ ok: false, error: 'Failed to join company' })
  }
}

export async function listMembers(req, res) {
  try {
    const { workspaceId } = req.params
    const ws = await Workspace.findOne({ workspaceId })
    if (!ws) return res.status(404).json({ error: 'Workspace not found' })
    const out = await membersToClientList(ws)
    return res.json(out)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to list members' })
  }
}

export async function addMember(req, res) {
  try {
    const { workspaceId } = req.params
    const body = req.body ?? {}
    const targetUserId = body.id ?? body.userId
    const targetUser = await User.findOne({ userId: String(targetUserId) })
    if (!targetUser) {
      return res.status(400).json({ error: 'User not found for this id' })
    }

    const ws = await Workspace.findOne({ workspaceId })
    if (!ws) return res.status(404).json({ error: 'Workspace not found' })

    if (findMemberSubdoc(ws, targetUser)) {
      return res.status(409).json({ error: 'User is already a member' })
    }

    const clientRole = body.role ?? 'member'
    const permissions = body.permissions ?? getDefaultPermissions(toClientRole(toDbRole(clientRole)))

    ws.members.push({
      user: targetUser._id,
      role: toDbRole(clientRole),
      status: 'ACTIVE',
      name: body.name ?? targetUser.name,
      email: body.email ?? targetUser.email,
      phone: body.phone ?? targetUser.phone,
      permissions,
      assignedProjectIds: body.assignedProjectIds ?? [],
    })
    await ws.save()

    const actor = await resolveActor(req)
    await logActivity({
      workspaceId,
      projectId: null,
      entityType: ENTITY_TYPES.TEAM,
      entityId: String(targetUser.userId),
      action: AUDIT_ACTIONS.ADD_MEMBER,
      performedBy: actor?._id,
      description: `${actor?.name ?? 'Someone'} added ${targetUser.name ?? targetUser.email} to the team (${clientRole})`,
      metadata: {
        role: toDbRole(clientRole),
        assignedProjectIds: body.assignedProjectIds ?? [],
      },
    })

    const wsFresh = await Workspace.findOne({ workspaceId })
    const sub = wsFresh ? findMemberSubdoc(wsFresh, targetUser) : null
    return res.status(201).json(memberSubdocToApi(sub, targetUser))
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to add member' })
  }
}

export async function updateMember(req, res) {
  try {
    const { workspaceId, memberId } = req.params
    const updates = req.body ?? {}

    const targetUser = await User.findOne({ userId: String(memberId) })
    if (!targetUser) return res.status(404).json({ error: 'Member not found' })

    const ws = await Workspace.findOne({ workspaceId })
    if (!ws) return res.status(404).json({ error: 'Workspace not found' })

    const sub = findMemberSubdoc(ws, targetUser)
    if (!sub) return res.status(404).json({ error: 'Member not found' })

    const before = {
      role: sub.role,
      assignedProjectIds: [...(sub.assignedProjectIds ?? [])],
    }

    if (updates.name !== undefined) sub.name = updates.name
    if (updates.email !== undefined) sub.email = updates.email
    if (updates.phone !== undefined) sub.phone = updates.phone
    if (updates.role !== undefined) sub.role = toDbRole(updates.role)
    if (updates.permissions !== undefined) sub.permissions = updates.permissions
    if (updates.assignedProjectIds !== undefined) sub.assignedProjectIds = updates.assignedProjectIds

    await ws.save()
    const fresh = findMemberSubdoc(ws, targetUser)

    const actor = await resolveActor(req)
    const roleChanged = before.role !== fresh.role
    const projectsChanged =
      JSON.stringify([...(before.assignedProjectIds ?? [])].sort()) !==
      JSON.stringify([...(fresh.assignedProjectIds ?? [])].sort())
    let desc = `${actor?.name ?? 'Someone'} updated ${targetUser.name ?? 'member'}`
    if (roleChanged) desc += `: role ${before.role} → ${fresh.role}`
    else if (projectsChanged) desc += ': project assignments updated'
    else desc += ' (profile updated)'

    await logActivity({
      workspaceId,
      projectId: null,
      entityType: ENTITY_TYPES.TEAM,
      entityId: String(targetUser.userId),
      action: AUDIT_ACTIONS.UPDATE_MEMBER,
      performedBy: actor?._id,
      description: desc,
      metadata: { before, after: { role: fresh.role, assignedProjectIds: fresh.assignedProjectIds ?? [] } },
    })

    return res.json(memberSubdocToApi(fresh, targetUser))
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to update member' })
  }
}

export async function removeMember(req, res) {
  try {
    const { workspaceId, memberId } = req.params
    const targetUser = await User.findOne({ userId: String(memberId) })
    if (!targetUser) return res.status(404).json({ error: 'Member not found' })

    await Workspace.findOneAndUpdate(
      { workspaceId },
      { $pull: { members: { user: targetUser._id } } }
    )

    const actor = await resolveActor(req)
    await logActivity({
      workspaceId,
      projectId: null,
      entityType: ENTITY_TYPES.TEAM,
      entityId: String(targetUser.userId),
      action: AUDIT_ACTIONS.REMOVE_MEMBER,
      performedBy: actor?._id,
      description: `${actor?.name ?? 'Someone'} removed ${targetUser.name ?? targetUser.email} from the team`,
      metadata: { removedUserId: targetUser.userId },
    })

    return res.status(204).send()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to remove member' })
  }
}

export async function listProjects(req, res) {
  try {
    const { workspaceId } = req.params
    const rows = await Project.find({ workspaceId }).lean()
    const list = rows.map((r) => r.payload).filter(Boolean)
    return res.json(list)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to list projects' })
  }
}

/** Replaces entire project list for workspace (mirrors localStorage save). */
export async function replaceAllProjects(req, res) {
  try {
    const { workspaceId } = req.params
    const list = req.body
    if (!Array.isArray(list)) {
      return res.status(400).json({ error: 'Expected array of projects' })
    }
    await Project.deleteMany({ workspaceId })
    if (list.length) {
      await Project.insertMany(
        list
          .filter((p) => p?.id)
          .map((p) => ({ workspaceId, projectId: p.id, payload: p }))
      )
    }

    const actor = await resolveActor(req)
    await logActivity({
      workspaceId,
      projectId: null,
      entityType: ENTITY_TYPES.PROJECT,
      entityId: workspaceId,
      action: AUDIT_ACTIONS.BULK_REPLACE,
      performedBy: actor?._id,
      description: `${actor?.name ?? 'User'} replaced all projects (${list.length} total)`,
      metadata: { count: list.length },
    })

    return res.json({ ok: true })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to save projects' })
  }
}

export async function createProject(req, res) {
  try {
    const { workspaceId } = req.params
    const p = req.body
    if (!p?.id || !p?.name) {
      return res.status(400).json({ error: 'Project id and name required' })
    }
    await Project.findOneAndUpdate(
      { workspaceId, projectId: p.id },
      { workspaceId, projectId: p.id, payload: p },
      { upsert: true }
    )

    const actor = await resolveActor(req)
    await logActivity({
      workspaceId,
      projectId: p.id,
      entityType: ENTITY_TYPES.PROJECT,
      entityId: p.id,
      action: AUDIT_ACTIONS.CREATE,
      performedBy: actor?._id,
      description: `Project '${p.name ?? p.id}' created`,
      metadata: { name: p.name, projectType: p.projectType },
    })

    return res.status(201).json(p)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to create project' })
  }
}

export async function updateProject(req, res) {
  try {
    const { workspaceId, projectId } = req.params
    const patch = req.body ?? {}
    const row = await Project.findOne({ workspaceId, projectId })
    if (!row) return res.status(404).json({ error: 'Project not found' })
    const beforePayload = { ...row.payload }
    const merged = { ...row.payload, ...patch, id: row.payload.id ?? projectId }
    row.payload = merged
    await row.save()

    const actor = await resolveActor(req)
    await logActivity({
      workspaceId,
      projectId,
      entityType: ENTITY_TYPES.PROJECT,
      entityId: projectId,
      action: AUDIT_ACTIONS.UPDATE,
      performedBy: actor?._id,
      description: `Project '${merged.name ?? projectId}' updated`,
      metadata: { before: beforePayload, after: merged },
    })

    return res.json(merged)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to update project' })
  }
}

export async function deleteProject(req, res) {
  try {
    const { workspaceId, projectId } = req.params
    const row = await Project.findOne({ workspaceId, projectId }).lean()
    const name = row?.payload?.name ?? projectId
    await Project.deleteOne({ workspaceId, projectId })

    const actor = await resolveActor(req)
    await logActivity({
      workspaceId,
      projectId,
      entityType: ENTITY_TYPES.PROJECT,
      entityId: projectId,
      action: AUDIT_ACTIONS.DELETE,
      performedBy: actor?._id,
      description: `Project '${name}' deleted`,
      metadata: { name },
    })

    return res.status(204).send()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to delete project' })
  }
}

function actorCanInviteTeam(actorRole) {
  return ['super_admin', 'admin', 'manager'].includes(actorRole)
}

export async function listInvitations(req, res) {
  try {
    const actor = req.workspaceMember
    if (!actor || !actorCanInviteTeam(actor.role)) {
      return res.status(403).json({ error: 'Not allowed to view invitations' })
    }
    const { workspaceId } = req.params
    const ws = await Workspace.findOne({ workspaceId })
    if (!ws) return res.status(404).json({ error: 'Workspace not found' })
    const list = (ws.invitations ?? []).map((i) => ({
      id: String(i._id),
      email: i.email,
      role: i.role,
      status: i.status,
      createdAt: i.createdAt,
    }))
    return res.json(list)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to list invitations' })
  }
}

export async function createInvitation(req, res) {
  try {
    const actor = req.workspaceMember
    if (!actor || !actorCanInviteTeam(actor.role)) {
      return res.status(403).json({ error: 'Not allowed to invite' })
    }
    const { workspaceId } = req.params
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const clientRole = req.body?.role ?? 'member'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email required' })
    }

    const ws = await Workspace.findOne({ workspaceId })
    if (!ws) return res.status(404).json({ error: 'Workspace not found' })

    const invEnum = clientInviteRoleToEnum(clientRole)

    const dup = (ws.invitations ?? []).some((i) => i.email === email && i.status === 'PENDING')
    if (dup) return res.status(409).json({ error: 'Invitation already pending for this email' })

    const targetUser = await User.findOne({ email })
    if (targetUser && findMemberSubdoc(ws, targetUser)) {
      return res.status(409).json({ error: 'User is already a member' })
    }

    const inviter = await getUserDocByUserId(req.userId)
    if (!inviter) return res.status(401).json({ error: 'Unauthorized' })

    ws.invitations.push({
      email,
      role: invEnum,
      status: 'PENDING',
      invitedBy: inviter._id,
      createdAt: new Date(),
    })
    await ws.save()
    const inv = ws.invitations[ws.invitations.length - 1]

    await logActivity({
      workspaceId,
      projectId: null,
      entityType: ENTITY_TYPES.INVITATION,
      entityId: String(inv._id),
      action: AUDIT_ACTIONS.INVITE_SENT,
      performedBy: inviter._id,
      description: `${inviter.name ?? 'Someone'} invited ${email} (${inv.role})`,
      metadata: { email, role: inv.role },
    })

    return res.status(201).json({
      id: String(inv._id),
      email: inv.email,
      role: inv.role,
      status: inv.status,
      createdAt: inv.createdAt,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to create invitation' })
  }
}
