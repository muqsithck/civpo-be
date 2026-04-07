/** Mirrors frontend `roleConfig.js` DEFAULT_ROLE_PERMISSIONS + getDefaultPermissions. */
const DEFAULT_ROLE_PERMISSIONS = {
  super_admin: { view_cost: true, create_task: true, add_material: true, generate_report: true, manage_users: true },
  admin: { view_cost: true, create_task: true, add_material: true, generate_report: true, manage_users: true },
  manager: { view_cost: true, create_task: true, add_material: true, generate_report: true, manage_users: false },
  member: { view_cost: true, create_task: true, add_material: true, generate_report: true, manage_users: false },
  viewer: { view_cost: true, create_task: false, add_material: false, generate_report: false, manage_users: false },
  reporter: { view_cost: true, create_task: true, add_material: true, generate_report: true, manage_users: false },
}

export function getDefaultPermissions(roleId) {
  const normalized = roleId === 'reporter' ? 'member' : roleId
  const perms = DEFAULT_ROLE_PERMISSIONS[normalized] ?? DEFAULT_ROLE_PERMISSIONS.member
  return perms ? { ...perms } : {}
}
