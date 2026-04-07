import mongoose from 'mongoose'

const workspaceLabourDataSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, unique: true, index: true },
    deployments: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
)

export const WorkspaceLabourData = mongoose.model('WorkspaceLabourData', workspaceLabourDataSchema)
