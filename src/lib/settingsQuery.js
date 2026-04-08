/** @param {string} s */
export function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * @param {string} workspaceId
 * @param {import('express').Request} req
 * @param {string} [searchField] model field to search (default 'name')
 */
export function buildSettingsListFilter(workspaceId, req, searchField = 'name') {
  const includeInactive = req.query?.includeInactive === 'true'
  /** @type {Record<string, unknown>} */
  const q = { workspaceId }
  if (!includeInactive) q.isActive = true

  const search = req.query?.search
  if (search && String(search).trim()) {
    q[searchField] = new RegExp(escapeRegex(String(search).trim()), 'i')
  }
  return q
}

export function getPagination(req) {
  const page = Math.max(1, parseInt(String(req.query?.page ?? '1'), 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query?.limit ?? '50'), 10) || 50))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}
