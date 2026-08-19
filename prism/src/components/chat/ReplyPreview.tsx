'use client'

import React from 'react'
import { ReplyTo, Message, MessageType } from '@/types/message'
import {
  CornerUpLeft,
  X,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface ReplyPreviewProps {
  /** Reply metadata if originating from a message replyTo field */
  replyTo?: ReplyTo | null
  /** Full message object if available */
  message?: Message | null
  /** Sender's display name */
  senderName?: string
  /** Text content preview */
  content?: string
  /** Media thumbnail or asset URL */
  mediaURL?: string | null
  /** Type of media */
  mediaType?: MessageType | null
  /** Callback when user clicks close/cancel button */
  onCancel?: () => void
  /** Callback when user clicks the preview (e.g. scroll to replied message) */
  onClick?: () => void
  /** Whether this preview is inside an outgoing (own) bubble */
  isOwn?: boolean
  /** Optional custom styling */
  className?: string
  /** Compact representation for nested bubbles */
  compact?: boolean
  /** Whether to show the close dismiss button */
  showCloseButton?: boolean
}

/**
 * Renders a preview of a replied-to message.
 * Used both inside MessageBubble and floating above MessageInput.
 */
export function ReplyPreview({
  replyTo,
  message,
  senderName: directSenderName,
  content: directContent,
  mediaURL: directMediaURL,
  mediaType: directMediaType,
  onCancel,
  onClick,
  isOwn = false,
  className,
  compact = false,
  showCloseButton,
}: ReplyPreviewProps) {
  // Resolve data from props, message, or replyTo
  const senderName =
    directSenderName ??
    replyTo?.senderName ??
    (message?.senderId ? 'User' : 'Unknown')

  const type: MessageType =
    directMediaType ??
    message?.type ??
    'text'

  const content =
    directContent ??
    replyTo?.contentPreview ??
    message?.content ??
    ''

  const mediaURL = directMediaURL ?? message?.mediaURL ?? null

  const shouldShowClose = showCloseButton ?? Boolean(onCancel)

  const renderMediaIcon = () => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
      case 'video':
        return <Video className="h-3.5 w-3.5 text-purple-500 shrink-0" />
      case 'voice':
        return <Mic className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
      case 'gif':
        return <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
      case 'file':
        return <FileText className="h-3.5 w-3.5 text-orange-500 shrink-0" />
      default:
        return null
    }
  }

  const renderPreviewText = () => {
    if (content.trim()) return content
    switch (type) {
      case 'image':
        return 'Photo'
      case 'video':
        return 'Video'
      case 'voice':
        return 'Voice message'
      case 'gif':
        return 'GIF'
      case 'file':
        return 'Attachment'
      default:
        return 'Message'
    }
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'group/reply flex items-center justify-between gap-2 overflow-hidden transition-all select-none',
        compact
          ? 'py-1 px-2.5 rounded-lg border-l-2 text-xs'
          : 'py-2 px-3 rounded-xl border-l-4 text-sm shadow-xs',
        isOwn
          ? 'bg-blue-700/40 hover:bg-blue-700/60 border-white/70 text-white'
          : 'bg-zinc-100/90 dark:bg-zinc-800/90 hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 border-blue-500 text-zinc-800 dark:text-zinc-200',
        onClick ? 'cursor-pointer' : '',
        className
      )}
    >
      {/* Left info area */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <CornerUpLeft
          className={cn(
            'shrink-0',
            compact ? 'h-3 w-3' : 'h-4 w-4',
            isOwn ? 'text-blue-200' : 'text-blue-500 dark:text-blue-400'
          )}
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'font-semibold leading-tight truncate',
              compact ? 'text-[11px]' : 'text-xs',
              isOwn ? 'text-white' : 'text-blue-600 dark:text-blue-400'
            )}
          >
            {senderName}
          </p>
          <div
            className={cn(
              'flex items-center gap-1 leading-snug truncate mt-0.5',
              compact ? 'text-[11px]' : 'text-xs',
              isOwn ? 'text-blue-100 opacity-90' : 'text-zinc-500 dark:text-zinc-400'
            )}
          >
            {renderMediaIcon()}
            <span className="truncate">{renderPreviewText()}</span>
          </div>
        </div>
      </div>

      {/* Right thumbnail preview if available */}
      {mediaURL && type === 'image' && (
        <div className="h-9 w-9 rounded-md overflow-hidden bg-zinc-200 shrink-0 border border-black/10">
          <img
            src={mediaURL}
            alt="Reply thumbnail"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Dismiss / Close button */}
      {shouldShowClose && onCancel && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onCancel()
          }}
          className={cn(
            'p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0',
            isOwn ? 'text-white/80 hover:text-white' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          )}
          title="Cancel reply"
          aria-label="Cancel reply"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export default ReplyPreview
