import mongoose from 'mongoose'
import { LabourType } from '../../models/LabourType.js'
import { buildSettingsListFilter, getPagination } from '../../lib/settingsQuery.js'
import { rejectIfDefault } from '../../lib/settingsDefaultGuard.js'
import { ensureWorkspaceSettings } from '../../services/seedSettings.js'

async function labourTypeInUse(_id, _workspaceId) {
  // Placeholder: wire to LabourDeployment / transactions when available
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
        LabourType.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
        LabourType.countDocuments(filter),
      ])
      return res.json({
        items,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      })
    }
    const items = await LabourType.find(filter).sort({ name: 1 }).lean()
    return res.json(items)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to list labour types' })
  }
}

export async function create(req, res) {
  try {
    const { workspaceId } = req.params
    const { name, dailyWage, unit, category } = req.body ?? {}
    if (!String(name ?? '').trim()) {
      return res.status(400).json({ error: 'name is required' })
    }
    const wage = Number(dailyWage)
    if (Number.isNaN(wage) || wage < 0) {
      return res.status(400).json({ error: 'dailyWage must be a non-negative number' })
    }
    const doc = await LabourType.create({
      workspaceId,
      name: String(name).trim(),
      dailyWage: wage,
      unit: unit === 'hour' ? 'hour' : 'day',
      category: category === 'Skilled' || category === 'Unskilled' ? category : undefined,
      isActive: true,
      isDefault: false,
    })
    return res.status(201).json(doc.toObject())
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to create labour type' })
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
    if (body.dailyWage !== undefined) {
      const w = Number(body.dailyWage)
      if (Number.isNaN(w) || w < 0) return res.status(400).json({ error: 'Invalid dailyWage' })
      updates.dailyWage = w
    }
    if (body.unit !== undefined) updates.unit = body.unit === 'hour' ? 'hour' : 'day'
    if (body.category !== undefined) {
      updates.category = body.category === null ? undefined : body.category
    }
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive)

    const doc = await LabourType.findOneAndUpdate(
      { _id: id, workspaceId },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    return res.json(doc)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to update labour type' })
  }
}

export async function remove(req, res) {
  try {
    const { workspaceId, id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid id' })
    }
    const inUse = await labourTypeInUse(id, workspaceId)
    if (inUse) {
      return res.status(409).json({ error: 'Cannot delete: item is in use' })
    }
    const existing = await LabourType.findOne({ _id: id, workspaceId }).lean()
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (rejectIfDefault(existing, res)) return

    const doc = await LabourType.findOneAndUpdate(
      { _id: id, workspaceId },
      { $set: { isActive: false } },
      { new: true }
    ).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to delete labour type' })
  }
}
