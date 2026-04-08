import mongoose from 'mongoose'

const workspaceMemberEmbeddedSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    /** SUPER_ADMIN | ADMIN | MANAGER | MEMBER | VIEWER */
    role: { type: String, required: true },
    roleOverride: { type: String, default: null },
    status: { type: String, enum: ['ACTIVE', 'INVITED'], default: 'ACTIVE' },
    name: { type: String, default: '' },
    email: { type: String },
    phone: { type: String },
    permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
    assignedProjectIds: { type: [String], default: [] },
  },
  { _id: true }
)

const invitationEmbeddedSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['ADMIN', 'MEMBER'], required: true },
    status: { type: String, enum: ['PENDING', 'ACCEPTED'], default: 'PENDING' },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const workspaceSchema = new mongoose.Schema(
  {
    workspaceId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    place: { type: String },
    logo: { type: String },
    companyCode: { type: String, required: true, index: true },
    alternateCodes: { type: [String], default: [] },
    ownerUserId: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: { type: [workspaceMemberEmbeddedSchema], default: [] },
    invitations: { type: [invitationEmbeddedSchema], default: [] },
  },
  { timestamps: true }
)

workspaceSchema.index({ 'members.user': 1 })
workspaceSchema.index({ 'invitations.email': 1 })

export const Workspace = mongoose.model('Workspace', workspaceSchema)
