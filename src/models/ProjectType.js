import mongoose from 'mongoose'

const projectTypeSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

projectTypeSchema.index({ workspaceId: 1, name: 1 }, { unique: true })

export const ProjectType = mongoose.model('ProjectType', projectTypeSchema)
