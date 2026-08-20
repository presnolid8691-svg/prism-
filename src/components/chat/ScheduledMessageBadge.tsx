'use client'

import React, { useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import {
  Clock,
  Calendar,
  Send,
  Trash2,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react'
import { formatMessageTime, isToday } from '@/lib/utils/formatTime'
import { cn } from '@/lib/utils/cn'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export interface ScheduledMessageBadgeProps {
  /** Timestamp, Date, ISO string, or milliseconds timestamp */
  scheduledFor?: Timestamp | Date | number | string | null
  /** Current scheduling status */
  status?: 'pending' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed'
  /** Triggered when user cancels schedule */
  onCancel?: () => void
  /** Triggered when user sends message immediately */
  onSendNow?: () => void
  /** Triggered when user reschedules */
  onReschedule?: () => void
  /** Click handler for entire badge */
  onClick?: () => void
  /** Custom Tailwind classes */
  className?: string
  /** Compact style */
  compact?: boolean
  /** Whether to render actions (Send Now, Cancel, etc.) */
  showActions?: boolean
}

/** Formats future timestamp for scheduled badge */
function formatScheduledTime(val?: Timestamp | Date | number | string | null): string {
  if (!val) return 'Scheduled'

  let date: Date
  if (val instanceof Timestamp) {
    date = val.toDate()
  } else if (val instanceof Date) {
    date = val
  } else if (typeof val === 'number') {
    date = new Date(val)
  } else {
    date = new Date(val)
  }

  if (isNaN(date.getTime())) return 'Scheduled'

  const timeStr = formatMessageTime(date)

  if (isToday(date)) {
    return `Today at ${timeStr}`
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  ) {
    return `Tomorrow at ${timeStr}`
  }

  return `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} at ${timeStr}`
}

/**
 * Badge displaying scheduled delivery time for a message with options to send now or cancel.
 */
export function ScheduledMessageBadge({
  scheduledFor,
  status = 'scheduled',
  onCancel,
  onSendNow,
  onReschedule,
  onClick,
  className,
  compact = false,
  showActions = true,
}: ScheduledMessageBadgeProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const timeLabel = formatScheduledTime(scheduledFor)

  const isPendingOrScheduled = status === 'pending' || status === 'scheduled'

  return (
    <div
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-all select-none',
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs shadow-xs',
        isPendingOrScheduled
          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
          : status === 'sending'
          ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40'
          : status === 'sent'
          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
          : 'bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
        onClick ? 'cursor-pointer hover:opacity-90' : '',
        className
      )}
    >
      {/* Status icon */}
      {status === 'sending' ? (
        <Loader2 className="h-3 w-3 animate-spin shrink-0" />
      ) : status === 'sent' ? (
        <Check className="h-3 w-3 shrink-0" />
      ) : status === 'failed' || status === 'cancelled' ? (
        <AlertCircle className="h-3 w-3 shrink-0" />
      ) : (
        <Clock className="h-3 w-3 shrink-0" />
      )}

      {/* Time label */}
      <span className="truncate">{timeLabel}</span>

      {/* Actions menu */}
      {showActions && (onSendNow || onCancel || onReschedule) && (
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="p-0.5 -mr-1 rounded-full hover:bg-amber-500/20 dark:hover:bg-amber-400/20 transition-colors"
              title="Schedule options"
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 text-xs">
            {onSendNow && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onSendNow()
                }}
                className="gap-2 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 text-blue-500" />
                <span>Send now</span>
              </DropdownMenuItem>
            )}
            {onReschedule && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onReschedule()
                }}
                className="gap-2 cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 text-amber-500" />
                <span>Reschedule</span>
              </DropdownMenuItem>
            )}
            {onCancel && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onCancel()
                  }}
                  className="gap-2 text-red-600 dark:text-red-400 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Cancel schedule</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

export default ScheduledMessageBadge
