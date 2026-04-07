import mongoose from 'mongoose'

/** Full project object as used by the frontend (id, name, progress, optional fields). */
const projectSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    projectId: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
)

projectSchema.index({ workspaceId: 1, projectId: 1 }, { unique: true })

export const Project = mongoose.model('Project', projectSchema)
