import mongoose from 'mongoose'

const unitSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    symbol: { type: String, required: true, trim: true },
    type: { type: String, enum: ['area', 'volume', 'count', 'weight'], required: true },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

unitSchema.index({ workspaceId: 1, symbol: 1 }, { unique: true })
unitSchema.index({ workspaceId: 1, name: 1 }, { unique: true })

export const Unit = mongoose.model('Unit', unitSchema)
