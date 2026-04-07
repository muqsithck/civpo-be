import mongoose from 'mongoose'

const workspaceActivityLogDataSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, unique: true, index: true },
    entries: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
)

export const WorkspaceActivityLogData = mongoose.model('WorkspaceActivityLogData', workspaceActivityLogDataSchema)
