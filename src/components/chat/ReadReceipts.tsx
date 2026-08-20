'use client'

import React from 'react'
import { Message, MessageStatus } from '@/types/message'
import { Check, CheckCheck, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface ReadReceiptsProps {
  /** The message object containing status, readBy, deliveredTo, etc. */
  message?: Message | null
  /** Current user's UID (message sender) */
  currentUid?: string | null
  /** Specific participant UID to check read status for (1-on-1 chats) */
  participantUid?: string | null
  /** Direct status override */
  status?: MessageStatus | 'read' | 'delivered'
  /** Direct readBy array override */
  readBy?: string[]
  /** Direct deliveredTo array override */
  deliveredTo?: string[]
  /** Optional class name */
  className?: string
  /** Show text label next to icon */
  showLabel?: boolean
  /** Icon size preset */
  size?: 'xs' | 'sm' | 'md'
}

/**
 * Renders WhatsApp / Telegram style read receipts (single check, double check, blue ticks, clock, error).
 */
export function ReadReceipts({
  message,
  currentUid,
  participantUid,
  status: directStatus,
  readBy: directReadBy,
  deliveredTo: directDeliveredTo,
  className,
  showLabel = false,
  size = 'sm',
}: ReadReceiptsProps) {
  const status = directStatus ?? message?.status
  const readByList = directReadBy ?? message?.readBy ?? []
  const deliveredToList = directDeliveredTo ?? message?.deliveredTo ?? []

  // Check if read by target recipient (or any non-sender recipient)
  const isRead = Boolean(
    status === 'read' ||
      (participantUid && participantUid.trim().length > 0
        ? readByList.includes(participantUid)
        : currentUid
        ? readByList.some((uid) => uid !== currentUid)
        : readByList.length > 0)
  )

  // Check if delivered to target recipient (or any non-sender recipient)
  const isDelivered = Boolean(
    isRead ||
      status === 'delivered' ||
      (participantUid && participantUid.trim().length > 0
        ? deliveredToList.includes(participantUid)
        : currentUid
        ? deliveredToList.some((uid) => uid !== currentUid)
        : deliveredToList.length > 0)
  )

  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
  }[size]

  // Status: Sending / Optimistic
  if (status === 'sending') {
    return (
      <span
        className={cn('inline-flex items-center gap-1 text-zinc-400 dark:text-zinc-500', className)}
        title="Sending..."
        aria-label="Sending..."
      >
        <Clock className={cn(sizeClasses, 'animate-pulse')} />
        {showLabel && <span className="text-[10px]">Sending...</span>}
      </span>
    )
  }

  // Status: Failed
  if (status === 'failed') {
    return (
      <span
        className={cn('inline-flex items-center gap-1 text-red-500 dark:text-red-400', className)}
        title="Failed to send. Click to retry."
        aria-label="Failed to send"
      >
        <AlertCircle className={sizeClasses} />
        {showLabel && <span className="text-[10px] font-medium">Failed</span>}
      </span>
    )
  }

  // Status: Read (Double Blue / Cyan Checkmarks)
  if (isRead) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-sky-400 dark:text-sky-400',
          className
        )}
        title="Read"
        aria-label="Read"
      >
        <CheckCheck className={sizeClasses} />
        {showLabel && <span className="text-[10px] font-medium text-sky-400">Read</span>}
      </span>
    )
  }

  // Status: Delivered (Double Gray Checkmarks)
  if (isDelivered) {
    return (
      <span
        className={cn('inline-flex items-center gap-1 text-zinc-400 dark:text-zinc-400', className)}
        title="Delivered"
        aria-label="Delivered"
      >
        <CheckCheck className={sizeClasses} />
        {showLabel && <span className="text-[10px]">Delivered</span>}
      </span>
    )
  }

  // Status: Sent to server (Single Gray Checkmark)
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-zinc-400 dark:text-zinc-400', className)}
      title="Sent"
      aria-label="Sent"
    >
      <Check className={sizeClasses} />
      {showLabel && <span className="text-[10px]">Sent</span>}
    </span>
  )
}

export default ReadReceipts
