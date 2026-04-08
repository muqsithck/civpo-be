import mongoose from 'mongoose'
import { Unit } from '../../models/Unit.js'
import { buildSettingsListFilter, getPagination } from '../../lib/settingsQuery.js'
import { rejectIfDefault } from '../../lib/settingsDefaultGuard.js'
import { ensureWorkspaceSettings } from '../../services/seedSettings.js'

async function unitInUse(_id, _workspaceId) {
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
        Unit.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
        Unit.countDocuments(filter),
      ])
      return res.json({
        items,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      })
    }
    const items = await Unit.find(filter).sort({ name: 1 }).lean()
    return res.json(items)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to list units' })
  }
}

export async function create(req, res) {
  try {
    const { workspaceId } = req.params
    const { name, symbol, type } = req.body ?? {}
    if (!String(name ?? '').trim() || !String(symbol ?? '').trim()) {
      return res.status(400).json({ error: 'name and symbol are required' })
    }
    const t = ['area', 'volume', 'count', 'weight'].includes(type) ? type : 'count'
    const doc = await Unit.create({
      workspaceId,
      name: String(name).trim(),
      symbol: String(symbol).trim().toLowerCase(),
      type: t,
      isActive: true,
      isDefault: false,
    })
    return res.status(201).json(doc.toObject())
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to create unit' })
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
    if (body.symbol !== undefined) updates.symbol = String(body.symbol).trim().toLowerCase()
    if (body.type !== undefined && ['area', 'volume', 'count', 'weight'].includes(body.type)) {
      updates.type = body.type
    }
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive)

    const doc = await Unit.findOneAndUpdate(
      { _id: id, workspaceId },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    return res.json(doc)
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to update unit' })
  }
}

export async function remove(req, res) {
  try {
    const { workspaceId, id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid id' })
    }
    const inUse = await unitInUse(id, workspaceId)
    if (inUse) {
      return res.status(409).json({ error: 'Cannot delete: item is in use' })
    }
    const existing = await Unit.findOne({ _id: id, workspaceId }).lean()
    if (!existing) return res.status(404).json({ error: 'Not found' })
    if (rejectIfDefault(existing, res)) return

    const doc = await Unit.findOneAndUpdate(
      { _id: id, workspaceId },
      { $set: { isActive: false } },
      { new: true }
    ).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to delete unit' })
  }
}
