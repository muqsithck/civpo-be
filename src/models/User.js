import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    roleOverride: { type: String, default: null },
    currentWorkspaceId: { type: String, default: null },
  },
  { timestamps: true }
)

export const User = mongoose.model('User', userSchema)
