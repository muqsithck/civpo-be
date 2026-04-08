import { User } from '../models/User.js'

/**
 * Resolve the Mongo user document for the authenticated JWT subject.
 */
export async function resolveActor(req) {
  if (!req?.userId) return null
  return User.findOne({ userId: req.userId }).select('_id name email').lean()
}
