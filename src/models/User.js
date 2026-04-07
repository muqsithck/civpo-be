import mongoose from 'mongoose'

const invitedMemberSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    email: String,
    phone: String,
    role: String,
  },
  { _id: false, strict: false }
)

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    invitedMembers: { type: [invitedMemberSchema], default: [] },
    roleOverride: { type: String, default: null },
    currentWorkspaceId: { type: String, default: null },
  },
  { timestamps: true }
)

export const User = mongoose.model('User', userSchema)
