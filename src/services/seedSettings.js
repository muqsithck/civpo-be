import { LabourType } from '../models/LabourType.js'
import { MachineryType } from '../models/MachineryType.js'
import { Unit } from '../models/Unit.js'
import { MaterialType } from '../models/MaterialType.js'
import { ProjectType } from '../models/ProjectType.js'
import { DEFAULT_SETTINGS } from '../config/defaultSettings.js'

const DUPLICATE_KEY = 11000

function isDuplicateKeyError(err) {
  return err?.code === DUPLICATE_KEY
}

/**
 * Self-healing: ensures each default row exists for this workspace (by name).
 * Modules are handled independently; safe to call repeatedly.
 */
export async function seedDefaultSettings(workspaceId) {
  if (!workspaceId) return

  await seedDefaultUnits(workspaceId)
  await seedDefaultLabour(workspaceId)
  await seedDefaultMachinery(workspaceId)
  await seedDefaultMaterials(workspaceId)
  await seedDefaultProjectTypes(workspaceId)
}

/**
 * Public entry: call before listing settings so old/partial workspaces get defaults.
 */
export async function ensureWorkspaceSettings(workspaceId) {
  await seedDefaultSettings(workspaceId)
}

async function seedDefaultUnits(workspaceId) {
  for (const u of DEFAULT_SETTINGS.units) {
    const name = String(u.name).trim()
    const exists = await Unit.exists({ workspaceId, name })
    if (exists) continue
    try {
      await Unit.create({
        workspaceId,
        name,
        symbol: String(u.symbol).trim().toLowerCase(),
        type: u.type,
        isActive: true,
        isDefault: true,
      })
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err
    }
  }
}

async function seedDefaultLabour(workspaceId) {
  for (const row of DEFAULT_SETTINGS.labour) {
    const name = String(row.name).trim()
    const exists = await LabourType.exists({ workspaceId, name })
    if (exists) continue
    try {
      await LabourType.create({
        workspaceId,
        name,
        dailyWage: row.dailyWage,
        unit: row.unit === 'hour' ? 'hour' : 'day',
        category: row.category === 'Skilled' || row.category === 'Unskilled' ? row.category : undefined,
        isActive: true,
        isDefault: true,
      })
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err
    }
  }
}

async function seedDefaultMachinery(workspaceId) {
  for (const row of DEFAULT_SETTINGS.machinery) {
    const name = String(row.name).trim()
    const exists = await MachineryType.exists({ workspaceId, name })
    if (exists) continue
    const unit = normalizeMachineryUnit(row.unit)
    try {
      await MachineryType.create({
        workspaceId,
        name,
        rate: row.rate,
        unit,
        isActive: true,
        isDefault: true,
      })
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err
    }
  }
}

function normalizeMachineryUnit(unit) {
  if (unit === 'day') return 'day'
  if (unit === 'trip') return 'trip'
  if (unit === 'hour') return 'hour'
  return 'day'
}

async function seedDefaultMaterials(workspaceId) {
  const units = await Unit.find({ workspaceId }).lean()
  const bySymbol = new Map(units.map((u) => [String(u.symbol).toLowerCase(), u]))

  for (const m of DEFAULT_SETTINGS.materials) {
    const name = String(m.name).trim()
    const exists = await MaterialType.exists({ workspaceId, name })
    if (exists) continue

    const sym = String(m.unit).trim().toLowerCase()
    const unitDoc = bySymbol.get(sym)

    try {
      await MaterialType.create({
        workspaceId,
        name,
        unit: sym,
        unitId: unitDoc?._id ?? null,
        defaultRate: Number(m.defaultRate) >= 0 ? Number(m.defaultRate) : 0,
        isActive: true,
        isDefault: true,
      })
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err
    }
  }
}

async function seedDefaultProjectTypes(workspaceId) {
  for (const row of DEFAULT_SETTINGS.projectTypes) {
    const name = String(row.name).trim()
    const exists = await ProjectType.exists({ workspaceId, name })
    if (exists) continue
    try {
      await ProjectType.create({
        workspaceId,
        name,
        description: row.description != null ? String(row.description).trim() : '',
        isActive: true,
        isDefault: true,
      })
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err
    }
  }
}
