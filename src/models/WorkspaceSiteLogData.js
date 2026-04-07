import mongoose from 'mongoose'

const workspaceSiteLogDataSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, unique: true, index: true },
    siteLogs: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
)

export const WorkspaceSiteLogData = mongoose.model('WorkspaceSiteLogData', workspaceSiteLogDataSchema)
