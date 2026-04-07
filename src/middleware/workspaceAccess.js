import { Workspace } from '../models/Workspace.js'
import { hydrateMemberForRequest } from '../lib/workspaceMembership.js'

/**
 * Ensures req.userId is a member of workspace :workspaceId (route param).
 */
export async function requireWorkspaceMember(req, res, next) {
  const { workspaceId } = req.params
  if (!workspaceId) {
    return res.status(400).json({ error: 'workspaceId required' })
  }
  const ws = await Workspace.findOne({ workspaceId })
  if (!ws) {
    return res.status(404).json({ error: 'Workspace not found' })
  }
  const { flat } = await hydrateMemberForRequest(ws, req.userId)
  if (!flat) {
    return res.status(403).json({ error: 'Not a member of this workspace' })
  }
  req.workspace = ws
  req.workspaceMember = flat
  next()
}
