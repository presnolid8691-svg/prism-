'use client'

import React from 'react'
import { cn } from '@/lib/utils/cn'

export interface TypingIndicatorProps {
  /** Array of user display names or user objects who are currently typing */
  typingUsers?: (string | { displayName?: string; name?: string })[]
  /** Direct single user name override */
  userName?: string
  /** Custom classes */
  className?: string
  /** Compact style */
  compact?: boolean
  /** Whether to show text next to bouncing dots */
  showText?: boolean
}

/** Formats the typing status text based on active typing users */
function formatTypingText(
  typingUsers?: (string | { displayName?: string; name?: string })[],
  userName?: string
): string {
  if (userName) return `${userName} is typing...`
  if (!typingUsers || typingUsers.length === 0) return 'Typing...'

  const names = typingUsers
    .map((u) => (typeof u === 'string' ? u : u.displayName || u.name || ''))
    .filter(Boolean)

  if (names.length === 0) return 'Typing...'
  if (names.length === 1) return `${names[0]} is typing...`
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`
  return `${names[0]}, ${names[1]} and ${names.length - 2} ${
    names.length - 2 === 1 ? 'other' : 'others'
  } are typing...`
}

/**
 * Animated 3-dot typing indicator bubble with user text.
 */
export function TypingIndicator({
  typingUsers = [],
  userName,
  className,
  compact = false,
  showText = true,
}: TypingIndicatorProps) {
  const text = formatTypingText(typingUsers, userName)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl rounded-bl-xs bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50 transition-all select-none animate-in fade-in duration-200',
        compact ? 'px-2.5 py-1.5' : 'px-3.5 py-2 shadow-xs',
        className
      )}
      aria-label={text}
      role="status"
    >
      {/* 3 Bouncing Dots */}
      <div className="flex items-center gap-1 shrink-0 py-0.5">
        <span
          className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"
          style={{ animationDuration: '1s', animationDelay: '0ms' }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"
          style={{ animationDuration: '1s', animationDelay: '180ms' }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"
          style={{ animationDuration: '1s', animationDelay: '360ms' }}
        />
      </div>

      {/* Typing label */}
      {showText && (
        <span
          className={cn(
            'text-zinc-500 dark:text-zinc-400 font-medium italic truncate',
            compact ? 'text-[10px]' : 'text-xs'
          )}
        >
          {text}
        </span>
      )}
    </div>
  )
}

export default TypingIndicator
