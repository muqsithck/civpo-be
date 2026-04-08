import mongoose from 'mongoose'
import { MaterialType } from '../../models/MaterialType.js'
import { buildSettingsListFilter, getPagination } from '../../lib/settingsQuery.js'
import { rejectIfDefault } from '../../lib/settingsDefaultGuard.js'
import { ensureWorkspaceSettings } from '../../services/seedSettings.js'

async function materialTypeInUse(_id, _workspaceId) {
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
        MaterialType.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
        MaterialType.countDocuments(filter),
      ])
      return res.json({
        items,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      })
    }
    const items = await MaterialType.find(filter).sort({ name: 1 }).lean()
    return res.json(items)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to list material types' })
  }
}

export async function create(req, res) {
  try {
    const { workspaceId } = req.params
    const { name, unit, unitId, defaultRate } = req.body ?? {}
    if (!String(name ?? '').trim()) {
      return res.status(400).json({ error: 'name is required' })
    }
    let unitObjectId = null
    if (unitId && mongoose.isValidObjectId(unitId)) {
      unitObjectId = new mongoose.Types.ObjectId(unitId)
    }
    const rate = defaultRate !== undefined ? Number(defaultRate) : 0
    if (Number.isNaN(rate) || rate < 0) {
      return res.status(400).json({ error: 'defaultRate must be non-negative' })
    }
    const doc = await MaterialType.create({
      workspaceId,
      name: String(name).trim(),
      unit: unit != null ? String(unit).trim() : '',
      unitId: unitObjectId,
      defaultRate: rate,
      isActive: true,
      isDefault: false,
    })
    return res.status(201).json(doc.toObject())
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to create material type' })
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
    if (body.unit !== undefined) updates.unit = String(body.unit).trim()
    if (body.unitId !== undefined) {
      updates.unitId =
        body.unitId && mongoose.isValidObjectId(body.unitId)
          ? new mongoose.Types.ObjectId(body.unitId)
          : null
    }
    if (body.defaultRate !== undefined) {
      const r = Number(body.defaultRate)
      if (Number.isNaN(r) || r < 0) return res.status(400).json({ error: 'Invalid defaultRate' })
      updates.defaultRate = r
    }
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive)

    const doc = await MaterialType.findOneAndUpdate(
      { _id: id, workspaceId },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    return res.json(doc)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to update material type' })
  }
}

export async function remove(req, res) {
  try {
    const { workspaceId, id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid id' })
    }
    const inUse = await materialTypeInUse(id, workspaceId)
    if (inUse) {
      return res.status(409).json({ error: 'Cannot delete: item is in use' })
    }
    const existing = await MaterialType.findOne({ _id: id, workspaceId }).lean()
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (rejectIfDefault(existing, res)) return

    const doc = await MaterialType.findOneAndUpdate(
      { _id: id, workspaceId },
      { $set: { isActive: false } },
      { new: true }
    ).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to delete material type' })
  }
}
