import mongoose from 'mongoose'

const planningDocumentSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    projectId: { type: String, required: true },
    stages: { type: [mongoose.Schema.Types.Mixed], default: [] },
    activities: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
)

planningDocumentSchema.index({ workspaceId: 1, projectId: 1 }, { unique: true })

export const PlanningDocument = mongoose.model('PlanningDocument', planningDocumentSchema)
