import mongoose from 'mongoose'

const workspaceMaterialDataSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, unique: true, index: true },
    entries: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
)

export const WorkspaceMaterialData = mongoose.model('WorkspaceMaterialData', workspaceMaterialDataSchema)
