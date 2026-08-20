/**
 * Generates a unique ID using timestamp + random string.
 * Used for optimistic UI message IDs before Firestore confirms.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generates a cryptographically random alphanumeric token.
 * Used for QA link tokens, invite codes, etc.
 */
export function generateToken(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => chars[b % chars.length])
    .join('')
}

/**
 * Generates a username from a display name by lowercasing,
 * stripping non-alphanumeric characters, and appending a 4-digit suffix.
 */
export function generateUsername(displayName: string): string {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15)
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${base}${suffix}`
}
