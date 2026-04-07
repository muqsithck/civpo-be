import { Workspace } from '../models/Workspace.js'

export function deriveCompanyCodeFromWorkspaceId(id) {
  if (id == null || id === '') return 'CIV1000'
  const s = String(id)
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const num = 1000 + (Math.abs(h) % 9000)
  return `CIV${num}`
}

export async function generateUniqueCompanyCode() {
  for (let i = 0; i < 50; i++) {
    const n = 1000 + Math.floor(Math.random() * 9000)
    const c = `CIV${n}`
    const exists = await Workspace.findOne({
      $or: [{ companyCode: c }, { alternateCodes: c }],
    })
    if (!exists) return c
  }
  return `CIV${Date.now().toString().slice(-4)}`
}

export async function findWorkspaceByJoinCode(raw) {
  const key = String(raw).trim().toUpperCase()
  if (!key) return null
  return Workspace.findOne({
    $or: [{ companyCode: key }, { alternateCodes: key }],
  })
}
