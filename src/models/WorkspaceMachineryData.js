import mongoose from 'mongoose'

const workspaceMachineryDataSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, unique: true, index: true },
    entries: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
)

export const WorkspaceMachineryData = mongoose.model('WorkspaceMachineryData', workspaceMachineryDataSchema)
