/**
 * Stable JSON compare for idempotent audit (skip duplicate PUTs with same payload).
 * Normalizes Mongo Date/ObjectId vs JSON from the client so equality matches logical data.
 */
function normalizeDoc(value) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') return value
  if (typeof value === 'bigint') return String(value)
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(normalizeDoc)
  if (typeof value === 'object') {
    if (value.constructor && value.constructor.name === 'ObjectId') return String(value)
    if (typeof value.toHexString === 'function' && typeof value.toString === 'function') {
      try {
        const s = value.toString()
        if (/^[a-f0-9]{24}$/i.test(s)) return s
      } catch {
        /* fall through */
      }
    }
    const keys = Object.keys(value).sort()
    const out = {}
    for (const k of keys) {
      out[k] = normalizeDoc(value[k])
    }
    return out
  }
  return value
}

export function stableJsonForCompare(arr) {
  if (!Array.isArray(arr)) return '[]'
  const sorted = [...arr].map(normalizeDoc).sort((x, y) => String(x?.id ?? '').localeCompare(String(y?.id ?? '')))
  return JSON.stringify(sorted)
}

export function payloadsEqual(a, b) {
  return stableJsonForCompare(a) === stableJsonForCompare(b)
}

function groupDeploymentsByProject(deployments) {
  const m = {}
  for (const d of deployments) {
    const pid = d.projectId != null && d.projectId !== '' ? String(d.projectId) : '__none__'
    if (!m[pid]) m[pid] = []
    m[pid].push(d)
  }
  return m
}

/** Project ids (string) whose deployment slices changed; excludes __none__ unless only bucket */
export function changedProjectIdsForDeployments(prev, next) {
  const a = groupDeploymentsByProject(Array.isArray(prev) ? prev : [])
  const b = groupDeploymentsByProject(Array.isArray(next) ? next : [])
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  const changed = []
  for (const k of keys) {
    const sa = stableJsonForCompare(a[k] || [])
    const sb = stableJsonForCompare(b[k] || [])
    if (sa !== sb && k !== '__none__') changed.push(k)
  }
  const noneA = stableJsonForCompare(a.__none__ || [])
  const noneB = stableJsonForCompare(b.__none__ || [])
  if (noneA !== noneB) changed.push(null)
  return changed
}

function groupEntriesByProject(entries) {
  const m = {}
  for (const e of entries) {
    const pid = e.projectId != null && e.projectId !== '' ? String(e.projectId) : '__none__'
    if (!m[pid]) m[pid] = []
    m[pid].push(e)
  }
  return m
}

export function changedProjectIdsForMaterialEntries(prev, next) {
  const a = groupEntriesByProject(Array.isArray(prev) ? prev : [])
  const b = groupEntriesByProject(Array.isArray(next) ? next : [])
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  const changed = []
  for (const k of keys) {
    const sa = stableJsonForCompare(a[k] || [])
    const sb = stableJsonForCompare(b[k] || [])
    if (sa !== sb && k !== '__none__') changed.push(k)
  }
  const noneA = stableJsonForCompare(a.__none__ || [])
  const noneB = stableJsonForCompare(b.__none__ || [])
  if (noneA !== noneB) changed.push(null)
  return changed
}

export { changedProjectIdsForMaterialEntries as changedProjectIdsForMachineryEntries }
