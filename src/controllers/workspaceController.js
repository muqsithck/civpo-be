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

    if (updates.name !== undefined) sub.name = updates.name
    if (updates.email !== undefined) sub.email = updates.email
    if (updates.phone !== undefined) sub.phone = updates.phone
    if (updates.role !== undefined) sub.role = toDbRole(updates.role)
    if (updates.permissions !== undefined) sub.permissions = updates.permissions
    if (updates.assignedProjectIds !== undefined) sub.assignedProjectIds = updates.assignedProjectIds

    await ws.save()
    const fresh = findMemberSubdoc(ws, targetUser)
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
    const merged = { ...row.payload, ...patch, id: row.payload.id ?? projectId }
    row.payload = merged
    await row.save()
    return res.json(merged)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to update project' })
  }
}

export async function deleteProject(req, res) {
  try {
    const { workspaceId, projectId } = req.params
    await Project.deleteOne({ workspaceId, projectId })
    return res.status(204).send()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to delete project' })
  }
}
