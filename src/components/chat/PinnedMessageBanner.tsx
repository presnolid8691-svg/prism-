'use client'

import React from 'react'
import { Message } from '@/types/message'
import { Pin, X, Image as ImageIcon, Video, Mic, FileText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface PinnedMessageBannerProps {
  message: Message
  onDismiss?: () => void
  onClick?: () => void
  className?: string
}

export function PinnedMessageBanner({
  message,
  onDismiss,
  onClick,
  className,
}: PinnedMessageBannerProps) {
  const getMessagePreview = () => {
    switch (message.type) {
      case 'image':
        return (
          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <ImageIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="truncate">{message.content || 'Photo'}</span>
          </span>
        )
      case 'video':
        return (
          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <Video className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span className="truncate">{message.content || 'Video'}</span>
          </span>
        )
      case 'voice':
        return (
          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <Mic className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Voice message</span>
          </span>
        )
      case 'file':
        return (
          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{message.content || 'Attachment'}</span>
          </span>
        )
      case 'gif':
        return (
          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <Sparkles className="h-3.5 w-3.5 text-pink-500 shrink-0" />
            <span>GIF</span>
          </span>
        )
      case 'text':
      default:
        return (
          <span className="truncate text-zinc-700 dark:text-zinc-300">
            {message.content || 'Pinned message'}
          </span>
        )
    }
  }

  return (
    <div
      className={cn(
        'w-full flex items-center justify-between px-3 py-1.5 bg-blue-50/90 dark:bg-zinc-800/90 backdrop-blur-md border-b border-blue-100 dark:border-zinc-700/70 transition-all cursor-pointer group hover:bg-blue-100/70 dark:hover:bg-zinc-800 z-10 select-none',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.()
        }
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
        <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
          <Pin className="h-3.5 w-3.5 rotate-45" />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 tracking-wide uppercase">
              Pinned Message
            </span>
          </div>
          <div className="text-xs truncate max-w-full leading-snug">
            {getMessagePreview()}
          </div>
        </div>

        {/* Thumbnail if image or gif */}
        {(message.type === 'image' || message.type === 'gif') &&
          (message.mediaURL || message.gifURL) && (
            <div className="w-7 h-7 rounded-md overflow-hidden bg-zinc-200 dark:bg-zinc-700 shrink-0 border border-zinc-200 dark:border-zinc-600">
              <img
                src={(message.type === 'gif' ? message.gifURL : message.mediaURL) || ''}
                alt="Thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          )}
      </div>

      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 rounded-full shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onDismiss()
          }}
          title="Dismiss pin banner"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
