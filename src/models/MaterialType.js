import mongoose from 'mongoose'

const materialTypeSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    /** Denormalized unit label (e.g. sqft) — optional link to Unit */
    unit: { type: String, trim: true, default: '' },
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', default: null },
    defaultRate: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

materialTypeSchema.index({ workspaceId: 1, name: 1 }, { unique: true })

export const MaterialType = mongoose.model('MaterialType', materialTypeSchema)
