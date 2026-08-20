import { Timestamp } from 'firebase/firestore'

/**
 * Convert a Firestore Timestamp or JS Date to a JS Date object.
 * Handles both gracefully so callers don't need to branch.
 */
function toDate(timestamp: Timestamp | Date): Date {
  if (timestamp instanceof Date) return timestamp
  return timestamp.toDate()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Returns true when the given timestamp falls on the current calendar day.
 */
export function isToday(timestamp: Timestamp | Date): boolean {
  const date = toDate(timestamp)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  )
}

// ─── Formatters ───────────────────────────────────────────────────────────────

/**
 * Format a timestamp as a short 12-hour clock string.
 * Example: "2:30 PM"
 */
export function formatMessageTime(timestamp: Timestamp | Date): string {
  const date = toDate(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format a last-seen timestamp with a human-readable prefix.
 * Examples:
 *   "Last seen today at 2:30 PM"
 *   "Last seen yesterday at 9:00 AM"
 *   "Last seen Aug 15, 2026"
 */
export function formatLastSeen(timestamp: Timestamp | Date): string {
  const date = toDate(timestamp)

  if (isToday(timestamp)) {
    return `Last seen today at ${formatMessageTime(timestamp)}`
  }

  if (isYesterday(date)) {
    return `Last seen yesterday at ${formatMessageTime(timestamp)}`
  }

  return `Last seen ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`
}

/**
 * Format a story timestamp as a compact relative duration.
 * Examples: "just now", "5m ago", "2h ago", "3d ago"
 */
export function formatStoryTime(timestamp: Timestamp | Date): string {
  const date = toDate(timestamp)
  const diffMs = Date.now() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)

  if (diffSecs < 60) return 'just now'

  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

/**
 * Format a message timestamp as a date separator label.
 * Returns "Today", "Yesterday", or a locale-formatted date string.
 * Example: "Aug 15, 2026"
 */
export function formatDateSeparator(timestamp: Timestamp | Date): string {
  const date = toDate(timestamp)

  if (isToday(timestamp)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format a duration in seconds as a "M:SS" string.
 * Example: formatDuration(90) → "1:30"
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
