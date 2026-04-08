import { AuditLog } from '../models/AuditLog.js'
import { AUDIT_METADATA_MAX_BYTES } from '../config/auditConstants.js'

/**
 * Sanitize metadata: strip functions, enforce size.
 */
function sanitizeMetadata(meta) {
  if (meta == null || typeof meta !== 'object') return {}
  try {
    const s = JSON.stringify(meta)
    if (s.length > AUDIT_METADATA_MAX_BYTES) {
      return {
        _truncated: true,
        _note: 'Metadata exceeded size limit',
        preview: JSON.parse(s.slice(0, Math.min(s.length, 8000))),
      }
    }
    return JSON.parse(s)
  } catch {
    return { _error: 'invalid_metadata' }
  }
}

/**
 * Central audit log entry. Never throws — failures are logged to console only.
 *
 * @param {object} params
 * @param {string} params.workspaceId
 * @param {string|null} [params.projectId]
 * @param {string} params.entityType
 * @param {string} [params.entityId]
 * @param {string} params.action
 * @param {import('mongoose').Types.ObjectId|null} [params.performedBy]
 * @param {string} [params.description]
 * @param {Record<string, unknown>} [params.metadata]
 */
export async function logActivity(params) {
  const {
    workspaceId,
    projectId = null,
    entityType,
    entityId = '',
    action,
    performedBy = null,
    description = '',
    metadata = {},
  } = params

  if (!workspaceId || !entityType || !action) {
    console.warn('[audit] logActivity skipped: missing workspaceId, entityType, or action')
    return null
  }

  try {
    const desc = String(description ?? '').slice(0, 2000)
    /** Skip duplicate lines from rapid double-PUT (e.g. React Strict Mode + concurrent saves). */
    if (desc && performedBy) {
      const cutoff = new Date(Date.now() - 4500)
      const dupFilter = {
        workspaceId,
        entityType: String(entityType),
        action: String(action),
        performedBy,
        description: desc,
        createdAt: { $gte: cutoff },
      }
      if (projectId != null && String(projectId).trim() !== '') {
        dupFilter.projectId = String(projectId).trim()
      } else {
        dupFilter.$or = [{ projectId: null }, { projectId: { $exists: false } }]
      }
      const recent = await AuditLog.findOne(dupFilter).sort({ createdAt: -1 }).lean()
      if (recent) {
        return recent
      }
    }

    const doc = await AuditLog.create({
      workspaceId,
      projectId: projectId || null,
      entityType: String(entityType),
      entityId: entityId != null ? String(entityId) : '',
      action: String(action),
      performedBy: performedBy || undefined,
      description: desc,
      metadata: sanitizeMetadata(metadata),
    })
    return doc
  } catch (err) {
    console.error('[audit] logActivity failed', err?.message ?? err)
    return null
  }
}
