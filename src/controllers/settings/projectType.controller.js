import mongoose from 'mongoose'
import { ProjectType } from '../../models/ProjectType.js'
import { buildSettingsListFilter, getPagination } from '../../lib/settingsQuery.js'
import { rejectIfDefault } from '../../lib/settingsDefaultGuard.js'
import { ensureWorkspaceSettings } from '../../services/seedSettings.js'

export async function list(req, res) {
  try {
    const { workspaceId } = req.params
    await ensureWorkspaceSettings(workspaceId)
    const filter = buildSettingsListFilter(workspaceId, req)
    const paginate = req.query?.paginate === 'true'
    if (paginate) {
      const { page, limit, skip } = getPagination(req)
      const [items, total] = await Promise.all([
        ProjectType.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
        ProjectType.countDocuments(filter),
      ])
      return res.json({
        items,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      })
    }
    const items = await ProjectType.find(filter).sort({ name: 1 }).lean()
    return res.json(items)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to list project types' })
  }
}

export async function create(req, res) {
  try {
    const { workspaceId } = req.params
    const { name, description } = req.body ?? {}
    if (!String(name ?? '').trim()) {
      return res.status(400).json({ error: 'name is required' })
    }
    const doc = await ProjectType.create({
      workspaceId,
      name: String(name).trim(),
      description: description != null ? String(description).trim() : '',
      isActive: true,
      isDefault: false,
    })
    return res.status(201).json(doc.toObject())
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to create project type' })
  }
}

export async function update(req, res) {
  try {
    const { workspaceId, id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid id' })
    }
    const body = req.body ?? {}
    const updates = {}
    if (body.name !== undefined) updates.name = String(body.name).trim()
    if (body.description !== undefined) updates.description = String(body.description ?? '').trim()
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive)

    const doc = await ProjectType.findOneAndUpdate(
      { _id: id, workspaceId },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    return res.json(doc)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to update project type' })
  }
}

export async function remove(req, res) {
  try {
    const { workspaceId, id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid id' })
    }
    const existing = await ProjectType.findOne({ _id: id, workspaceId }).lean()
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (rejectIfDefault(existing, res)) return

    const doc = await ProjectType.findOneAndUpdate(
      { _id: id, workspaceId },
      { $set: { isActive: false } },
      { new: true }
    ).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to delete project type' })
  }
}
