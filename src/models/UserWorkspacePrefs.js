import mongoose from 'mongoose'

const projectPrefsSchema = new mongoose.Schema(
  {
    lastTrade: String,
    lastMaterialType: String,
    lastMachineType: String,
  },
  { _id: false }
)

const userWorkspacePrefsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    activeProject: { type: mongoose.Schema.Types.Mixed, default: null },
    lastProjectId: { type: String, default: null },
    projectPrefs: { type: Map, of: projectPrefsSchema, default: {} },
  },
  { timestamps: true }
)

userWorkspacePrefsSchema.index({ userId: 1, workspaceId: 1 }, { unique: true })

export const UserWorkspacePrefs = mongoose.model('UserWorkspacePrefs', userWorkspacePrefsSchema)
