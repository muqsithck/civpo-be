/**
 * Central enums for audit logs (extend as features grow).
 */

export const ENTITY_TYPES = Object.freeze({
  PROJECT: 'PROJECT',
  SCHEDULE: 'SCHEDULE',
  ESTIMATE: 'ESTIMATE',
  LABOUR: 'LABOUR',
  PROGRESS: 'PROGRESS',
  USER: 'USER',
  TEAM: 'TEAM',
  SITE_LOG: 'SITE_LOG',
  MATERIAL: 'MATERIAL',
  MACHINERY: 'MACHINERY',
  WORKSPACE: 'WORKSPACE',
  INVITATION: 'INVITATION',
})

export const AUDIT_ACTIONS = Object.freeze({
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  BULK_REPLACE: 'BULK_REPLACE',
  ADD_MEMBER: 'ADD_MEMBER',
  REMOVE_MEMBER: 'REMOVE_MEMBER',
  UPDATE_MEMBER: 'UPDATE_MEMBER',
  INVITE_SENT: 'INVITE_SENT',
  LOGIN: 'LOGIN',
})

/** Max JSON size for metadata (bytes, approximate) */
export const AUDIT_METADATA_MAX_BYTES = 16_000
