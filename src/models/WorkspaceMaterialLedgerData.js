import mongoose from 'mongoose'

const workspaceMaterialLedgerDataSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, unique: true, index: true },
    entries: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
)

export const WorkspaceMaterialLedgerData = mongoose.model('WorkspaceMaterialLedgerData', workspaceMaterialLedgerDataSchema)
