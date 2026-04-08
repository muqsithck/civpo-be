import mongoose from 'mongoose'

const machineryTypeSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ['hour', 'day', 'trip'], required: true },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

machineryTypeSchema.index({ workspaceId: 1, name: 1 }, { unique: true })

export const MachineryType = mongoose.model('MachineryType', machineryTypeSchema)
