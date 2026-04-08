/**
 * Block soft-delete of seeded default master rows (isDefault: true).
 */
export function rejectIfDefault(existing, res) {
  if (existing?.isDefault) {
    const message = 'Default items cannot be deleted'
    res.status(400).json({ message, error: message })
    return true
  }
  return false
}
