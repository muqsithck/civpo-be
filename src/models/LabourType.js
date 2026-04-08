import mongoose from 'mongoose'

const labourTypeSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    dailyWage: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ['day', 'hour'], default: 'day' },
    category: { type: String, enum: ['Skilled', 'Unskilled'] },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

labourTypeSchema.index({ workspaceId: 1, name: 1 }, { unique: true })

export const LabourType = mongoose.model('LabourType', labourTypeSchema)
