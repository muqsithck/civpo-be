import mongoose from 'mongoose'
import { MachineryType } from '../../models/MachineryType.js'
import { buildSettingsListFilter, getPagination } from '../../lib/settingsQuery.js'
import { rejectIfDefault } from '../../lib/settingsDefaultGuard.js'
import { ensureWorkspaceSettings } from '../../services/seedSettings.js'

async function machineryTypeInUse(_id, _workspaceId) {
  return false
}

export async function list(req, res) {
  try {
    const { workspaceId } = req.params
    await ensureWorkspaceSettings(workspaceId)
    const filter = buildSettingsListFilter(workspaceId, req)
    const paginate = req.query?.paginate === 'true'
    if (paginate) {
      const { page, limit, skip } = getPagination(req)
      const [items, total] = await Promise.all([
        MachineryType.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
        MachineryType.countDocuments(filter),
      ])
      return res.json({
        items,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      })
    }
    const items = await MachineryType.find(filter).sort({ name: 1 }).lean()
    return res.json(items)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to list machinery types' })
  }
}

export async function create(req, res) {
  try {
    const { workspaceId } = req.params
    const { name, rate, unit } = req.body ?? {}
    if (!String(name ?? '').trim()) {
      return res.status(400).json({ error: 'name is required' })
    }
    const r = Number(rate)
    if (Number.isNaN(r) || r < 0) {
      return res.status(400).json({ error: 'rate must be a non-negative number' })
    }
    const u = unit === 'day' ? 'day' : unit === 'trip' ? 'trip' : 'hour'
    const doc = await MachineryType.create({
      workspaceId,
      name: String(name).trim(),
      rate: r,
      unit: u,
      isActive: true,
      isDefault: false,
    })
    return res.status(201).json(doc.toObject())
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to create machinery type' })
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
    if (body.rate !== undefined) {
      const r = Number(body.rate)
      if (Number.isNaN(r) || r < 0) return res.status(400).json({ error: 'Invalid rate' })
      updates.rate = r
    }
    if (body.unit !== undefined) {
      updates.unit =
        body.unit === 'day' ? 'day' : body.unit === 'trip' ? 'trip' : 'hour'
    }
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive)

    const doc = await MachineryType.findOneAndUpdate(
      { _id: id, workspaceId },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    return res.json(doc)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to update machinery type' })
  }
}

export async function remove(req, res) {
  try {
    const { workspaceId, id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid id' })
    }
    const inUse = await machineryTypeInUse(id, workspaceId)
    if (inUse) {
      return res.status(409).json({ error: 'Cannot delete: item is in use' })
    }
    const existing = await MachineryType.findOne({ _id: id, workspaceId }).lean()
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (rejectIfDefault(existing, res)) return

    const doc = await MachineryType.findOneAndUpdate(
      { _id: id, workspaceId },
      { $set: { isActive: false } },
      { new: true }
    ).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to delete machinery type' })
  }
}
