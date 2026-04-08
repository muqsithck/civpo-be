/**
 * Human-readable lines for labour / material audit logs.
 */

import { stableJsonForCompare } from './auditSnapshot.js'

function formatRs(n) {
  const x = Number(n)
  if (!Number.isFinite(x) || x <= 0) return null
  return `₹${Math.round(x)}`
}

/**
 * @param {object[]} deployments
 * @param {string|null} projectId
 */
export function describeLabourDeploymentsForProject(deployments, projectId) {
  const rows = (deployments || []).filter((d) => {
    if (projectId == null) return d.projectId == null || d.projectId === ''
    return String(d.projectId) === String(projectId)
  })
  if (rows.length === 0) return 'no deployments'

  const tradeParts = []
  let totalCost = 0
  for (const d of rows) {
    totalCost += Number(d.totalLabourCost) || 0
    const mix = d.labourMix || d.manpower || []
    for (const m of mix) {
      const label = (m.tradeName || m.trade || m.category || 'Worker').trim()
      const n =
        (Number(m.count) || 0) +
        (Number(m.helperCount) || 0) +
        (Number(m.workers) || 0)
      if (n > 0) tradeParts.push(`${n} ${label}`)
    }
  }

  const costStr = formatRs(totalCost)
  if (tradeParts.length) {
    return costStr ? `${tradeParts.join(', ')} · ${costStr}` : tradeParts.join(', ')
  }
  const n = rows.length
  return costStr ? `${n} deployment(s) · ${costStr}` : `${n} deployment(s)`
}

function filterMaterialByProject(entries, projectId) {
  return (entries || []).filter((e) => {
    if (projectId == null) return e.projectId == null || e.projectId === ''
    return String(e.projectId) === String(projectId)
  })
}

function formatMaterialLine(e) {
  const name = (e.materialName || e.materialType || 'Material').trim()
  const qty = e.quantity != null ? String(e.quantity) : ''
  const unit = (e.unit || '').trim()
  const tc = Number(e.totalCost) || 0
  const qtyUnit = [qty, unit].filter(Boolean).join(' ')
  const lineCost = formatRs(tc)
  return lineCost ? `${name} ${qtyUnit} · ${lineCost}` : `${name} ${qtyUnit}`.trim()
}

function entrySig(e) {
  return stableJsonForCompare([e])
}

/**
 * Only added / removed / modified rows for this project (not the full list).
 * @param {object[]|null|undefined} prev
 * @param {object[]|null|undefined} next
 * @param {string|null} projectId
 */
export function describeMaterialEntriesDiff(prev, next, projectId) {
  const a = filterMaterialByProject(prev, projectId)
  const b = filterMaterialByProject(next, projectId)

  const am = new Map()
  const bm = new Map()
  for (const e of a) {
    const id = e?.id != null && String(e.id) !== '' ? String(e.id) : null
    if (id) am.set(id, e)
  }
  for (const e of b) {
    const id = e?.id != null && String(e.id) !== '' ? String(e.id) : null
    if (id) bm.set(id, e)
  }

  const added = []
  const removed = []
  const modified = []

  for (const [id, ne] of bm) {
    if (!am.has(id)) added.push(ne)
    else {
      const pe = am.get(id)
      if (entrySig(pe) !== entrySig(ne)) modified.push({ prev: pe, next: ne })
    }
  }
  for (const [id, pe] of am) {
    if (!bm.has(id)) removed.push(pe)
  }

  const parts = []
  for (const e of added) parts.push(`added ${formatMaterialLine(e)}`)
  for (const e of removed) parts.push(`removed ${formatMaterialLine(e)}`)
  for (const { prev: pe, next: ne } of modified) {
    parts.push(`updated ${formatMaterialLine(pe)} → ${formatMaterialLine(ne)}`)
  }

  if (parts.length > 0) {
    const head = parts.slice(0, 8).join('; ')
    return parts.length > 8 ? `${head}; …` : head
  }

  // Id-less rows or signature-only changes: fall back to slice inequality
  if (stableJsonForCompare(a) !== stableJsonForCompare(b)) {
    return `${b.length} row(s) changed`
  }
  return 'no changes'
}

const MACHINE_LABELS = {
  concrete_mixer: 'Concrete Mixer',
  jcb: 'JCB',
  excavator: 'Excavator',
  crane: 'Crane',
  tower_crane: 'Tower Crane',
  vibrator: 'Vibrator',
  water_tanker: 'Water Tanker',
  other: 'Other',
}

function filterMachineryByProject(entries, projectId) {
  return filterMaterialByProject(entries, projectId)
}

function formatMachineryLine(e) {
  const typeLabel = (e.machineType && MACHINE_LABELS[e.machineType]) || e.machineType || ''
  const label = (e.machineName && String(e.machineName).trim()) || typeLabel || 'Machinery'
  const h = e.hoursUsed != null && e.hoursUsed !== '' ? `${Number(e.hoursUsed)}h` : ''
  const c = formatRs(Number(e.cost) || 0)
  const base = [label, h].filter(Boolean).join(' ')
  return c ? `${base} · ${c}` : base
}

/**
 * Added / removed / modified machinery rows for this project only.
 */
export function describeMachineryEntriesDiff(prev, next, projectId) {
  const a = filterMachineryByProject(prev, projectId)
  const b = filterMachineryByProject(next, projectId)

  const am = new Map()
  const bm = new Map()
  for (const e of a) {
    const id = e?.id != null && String(e.id) !== '' ? String(e.id) : null
    if (id) am.set(id, e)
  }
  for (const e of b) {
    const id = e?.id != null && String(e.id) !== '' ? String(e.id) : null
    if (id) bm.set(id, e)
  }

  const added = []
  const removed = []
  const modified = []

  for (const [id, ne] of bm) {
    if (!am.has(id)) added.push(ne)
    else {
      const pe = am.get(id)
      if (entrySig(pe) !== entrySig(ne)) modified.push({ prev: pe, next: ne })
    }
  }
  for (const [id, pe] of am) {
    if (!bm.has(id)) removed.push(pe)
  }

  const parts = []
  for (const e of added) parts.push(`added ${formatMachineryLine(e)}`)
  for (const e of removed) parts.push(`removed ${formatMachineryLine(e)}`)
  for (const { prev: pe, next: ne } of modified) {
    parts.push(`updated ${formatMachineryLine(pe)} → ${formatMachineryLine(ne)}`)
  }

  if (parts.length > 0) {
    const head = parts.slice(0, 8).join('; ')
    return parts.length > 8 ? `${head}; …` : head
  }

  if (stableJsonForCompare(a) !== stableJsonForCompare(b)) {
    return `${b.length} row(s) changed`
  }
  return 'no changes'
}
