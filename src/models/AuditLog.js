import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    /** Workspace key (string id, e.g. ws-123) */
    workspaceId: { type: String, required: true, index: true },
    /** Project id from payload when applicable */
    projectId: { type: String, default: null, index: true },

    entityType: { type: String, required: true, index: true },
    /** String id for the affected entity (project id, member userId, etc.) */
    entityId: { type: String, default: '' },

    action: { type: String, required: true, index: true },

    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    description: { type: String, trim: true, default: '' },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

auditLogSchema.index({ workspaceId: 1, createdAt: -1 })
auditLogSchema.index({ projectId: 1, createdAt: -1 })

export const AuditLog = mongoose.model('AuditLog', auditLogSchema)
