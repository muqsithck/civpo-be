import { AuditLog } from '../models/AuditLog.js'

/**
 * GET /api/workspaces/:workspaceId/history
 * Query: projectId, entityType, action, page, limit
 */
export async function listHistory(req, res) {
  try {
    const { workspaceId } = req.params
    const {
      projectId,
      entityType,
      action,
      page: pageRaw,
      limit: limitRaw,
    } = req.query ?? {}

    const page = Math.max(1, parseInt(String(pageRaw ?? '1'), 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(String(limitRaw ?? '50'), 10) || 50))
    const skip = (page - 1) * limit

    const filter = { workspaceId }
    // Only narrow by project when client sends projectId (omit for full workspace history)
    if (projectId != null && String(projectId).trim() !== '') {
      filter.projectId = String(projectId).trim()
    }
    if (entityType && String(entityType).trim()) {
      filter.entityType = String(entityType).trim()
    }
    if (action && String(action).trim()) {
      filter.action = String(action).trim()
    }

    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedBy', 'name email userId')
        .lean(),
      AuditLog.countDocuments(filter),
    ])

    return res.json({
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Failed to load audit history' })
  }
}
