'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Message, ReplyTo, LinkPreview } from '@/types/message'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { VoiceNotePlayer } from './VoiceNotePlayer'
import { ReplyPreview } from './ReplyPreview'
import { LinkPreviewCard } from './LinkPreviewCard'
import { ReactionPicker } from './ReactionPicker'
import { ReadReceipts } from './ReadReceipts'
import { formatMessageTime, formatFileSize } from '@/lib/utils/formatTime'
import { cn } from '@/lib/utils/cn'
import {
  CornerUpRight,
  Smile,
  Copy,
  Pin,
  Bookmark,
  Trash2,
  MoreHorizontal,
  FileText,
  Loader2,
  RotateCcw,
  ExternalLink,
  MessageSquare,
  Flame,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { User } from '@/types/user'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar?: boolean
  senderUser?: User | null
  onReply: () => void
  onReact: (msgId: string, emoji: string) => void
  onOpenThread?: (msgId: string) => void
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

/** Detects URLs in text and wraps them in <a> tags */
function renderTextWithLinks(text: string) {
  const urlRegex = /https?:\/\/[^\s]+/g
  const parts = text.split(urlRegex)
  const urls = text.match(urlRegex) ?? []
  const result: React.ReactNode[] = []
  parts.forEach((part, i) => {
    result.push(part)
    if (urls[i]) {
      result.push(
        <a
          key={i}
          href={urls[i]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 opacity-90 hover:opacity-100"
        >
          {urls[i]}
        </a>
      )
    }
  })
  return result
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  senderUser,
  onReply,
  onReact,
  onOpenThread,
}: MessageBubbleProps) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [selfDestructExpired, setSelfDestructExpired] = useState(false)
  const [selfDestructSecsLeft, setSelfDestructSecsLeft] = useState<number | null>(null)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const doubleClickRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDeleted = !!message.deletedAt

  // Self-destruct countdown
  useEffect(() => {
    if (!message.selfDestruct?.enabled || !message.selfDestruct.expiresAt) return
    const interval = setInterval(() => {
      const secsLeft = Math.max(
        0,
        Math.ceil(
          (message.selfDestruct!.expiresAt!.toDate().getTime() - Date.now()) / 1000
        )
      )
      setSelfDestructSecsLeft(secsLeft)
      if (secsLeft <= 0) {
        setSelfDestructExpired(true)
        clearInterval(interval)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [message.selfDestruct])

  const handleDoubleClick = useCallback(() => {
    if (doubleClickRef.current) clearTimeout(doubleClickRef.current)
    onReact(message.id, '❤️')
  }, [message.id, onReact])

  const reactions = Object.entries(message.reactions ?? {})
    .filter(([, uids]) => uids.length > 0)
    .map(([emoji, uids]) => ({ emoji, count: uids.length }))

  const renderContent = () => {
    if (isDeleted) {
      return (
        <span className={cn('italic text-sm', isOwn ? 'text-blue-200' : 'text-zinc-400')}>
          Message deleted
        </span>
      )
    }
    if (selfDestructExpired) {
      return (
        <span className={cn('italic text-sm flex items-center gap-1', isOwn ? 'text-blue-200' : 'text-zinc-400')}>
          <Flame className="h-3.5 w-3.5" />
          Destroyed
        </span>
      )
    }

    switch (message.type) {
      case 'text':
        return (
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
            {renderTextWithLinks(message.content)}
          </p>
        )
      case 'image':
        return (
          <button
            onClick={() => setImageViewerOpen(true)}
            className="block max-w-[240px] rounded-xl overflow-hidden"
          >
            <img
              src={message.mediaURL ?? ''}
              alt="Image"
              className="w-full object-cover hover:opacity-90 transition-opacity"
              loading="lazy"
            />
          </button>
        )
      case 'video':
        return (
          <video
            src={message.mediaURL ?? ''}
            controls
            className="max-w-[240px] rounded-xl"
          />
        )
      case 'voice':
        return (
          <VoiceNotePlayer
            audioURL={message.mediaURL ?? ''}
            waveformData={message.mediaMeta?.waveformData ?? []}
            duration={message.mediaMeta?.durationSecs ?? 0}
          />
        )
      case 'gif':
        return (
          <div className="max-w-[220px]">
            <img
              src={message.gifURL ?? ''}
              alt="GIF"
              className="rounded-xl w-full"
              loading="lazy"
            />
            <p className="text-[9px] text-zinc-400 mt-0.5 text-right">Powered by GIPHY</p>
          </div>
        )
      case 'file':
        return (
          <a
            href={message.mediaURL ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg max-w-[220px] transition-opacity hover:opacity-80',
              isOwn ? 'bg-blue-500' : 'bg-zinc-200'
            )}
          >
            <FileText className={cn('h-5 w-5 shrink-0', isOwn ? 'text-white' : 'text-zinc-600')} />
            <div className="min-w-0">
              <p className={cn('text-xs font-medium truncate', isOwn ? 'text-white' : 'text-zinc-800')}>
                {message.content || 'File'}
              </p>
              {message.mediaMeta?.sizeBytes != null && (
                <p className={cn('text-[10px]', isOwn ? 'text-blue-200' : 'text-zinc-400')}>
                  {formatFileSize(message.mediaMeta.sizeBytes)}
                </p>
              )}
            </div>
            <ExternalLink className={cn('h-3.5 w-3.5 shrink-0', isOwn ? 'text-blue-200' : 'text-zinc-400')} />
          </a>
        )
      default:
        return <p className="text-sm">{message.content}</p>
    }
  }

  return (
    <div
      className={cn(
        'flex gap-2 group relative',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        'mb-1'
      )}
      onDoubleClick={handleDoubleClick}
    >
      {/* Avatar for others */}
      {!isOwn && (
        <div className="w-8 shrink-0 self-end">
          {showAvatar ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={senderUser?.photoURL ?? undefined} />
              <AvatarFallback className="bg-zinc-200 text-zinc-700 text-xs">
                {senderUser ? getInitials(senderUser.displayName) : '?'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-8 w-8" />
          )}
        </div>
      )}

      <div className={cn('flex flex-col max-w-[75%]', isOwn ? 'items-end' : 'items-start')}>
        {/* Reply preview */}
        {message.replyTo && (
          <div
            className={cn(
              'mb-1 px-2 py-1 rounded-lg border-l-2 text-xs max-w-full',
              isOwn
                ? 'bg-blue-500 border-white/50 text-blue-100'
                : 'bg-zinc-200 border-blue-400 text-zinc-600'
            )}
          >
            <p className="font-semibold truncate">{message.replyTo.senderName}</p>
            <p className="truncate opacity-80">{message.replyTo.contentPreview}</p>
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'relative rounded-2xl px-3 py-2',
            isOwn
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-zinc-100 text-zinc-900 rounded-bl-sm',
            message.type === 'image' || message.type === 'video' || message.type === 'gif'
              ? 'p-1'
              : '',
            message.status === 'failed' && 'opacity-60'
          )}
        >
          {/* Self-destruct timer overlay */}
          {message.selfDestruct?.enabled && selfDestructSecsLeft !== null && selfDestructSecsLeft > 0 && (
            <div
              className={cn(
                'absolute top-1 right-1 flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                isOwn ? 'bg-blue-500 text-blue-100' : 'bg-zinc-300 text-zinc-600'
              )}
            >
              <Flame className="h-2.5 w-2.5" />
              {selfDestructSecsLeft}s
            </div>
          )}
          {renderContent()}
        </div>

        {/* Link preview */}
        {message.linkPreview && !isDeleted && (
          <div className="mt-1 w-full max-w-[280px]">
            <LinkPreviewCard preview={message.linkPreview} />
          </div>
        )}

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {reactions.map(({ emoji, count }) => (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji)}
                className="flex items-center gap-0.5 text-xs bg-white border border-zinc-200 rounded-full px-1.5 py-0.5 hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm"
              >
                <span>{emoji}</span>
                <span className="text-zinc-600 font-medium">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Footer: time + status */}
        <div className={cn('flex items-center gap-1 mt-0.5', isOwn ? 'flex-row-reverse' : '')}>
          <span className="text-[10px] text-zinc-400">
            {formatMessageTime(message.sentAt)}
            {message.editedAt && ' · edited'}
          </span>
          {isOwn && (
            <>
              {message.status === 'sending' && (
                <Loader2 className="h-3 w-3 text-zinc-400 animate-spin" />
              )}
              {message.status === 'failed' && (
                <RotateCcw className="h-3 w-3 text-red-400" />
              )}
              {(!message.status || message.status === 'sent') && (
                <ReadReceipts
                  message={message}
                  currentUid={message.senderId}
                  participantUid={''}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Hover action row */}
      <div
        className={cn(
          'flex items-center gap-0.5 self-center opacity-0 group-hover:opacity-100 transition-opacity',
          isOwn ? 'flex-row-reverse' : ''
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-zinc-400 hover:text-zinc-700"
          onClick={onReply}
        >
          <CornerUpRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-zinc-400 hover:text-zinc-700"
          onClick={() => setEmojiPickerOpen((o) => !o)}
        >
          <Smile className="h-3.5 w-3.5" />
        </Button>
        {onOpenThread && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-400 hover:text-zinc-700"
            onClick={() => onOpenThread(message.id)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-400 hover:text-zinc-700"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isOwn ? 'end' : 'start'} className="w-44">
            <DropdownMenuItem onClick={onReply}>
              <CornerUpRight className="h-4 w-4 mr-2" />
              Reply
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy text
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pin className="h-4 w-4 mr-2" />
              Pin message
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bookmark className="h-4 w-4 mr-2" />
              Save message
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Emoji picker */}
      {emojiPickerOpen && (
        <div
          className={cn(
            'absolute z-30 bottom-10',
            isOwn ? 'right-0' : 'left-0'
          )}
        >
          <ReactionPicker
            onEmojiSelect={(emoji) => {
              onReact(message.id, emoji)
              setEmojiPickerOpen(false)
            }}
          />
        </div>
      )}

      {/* Image viewer (simple) */}
      {imageViewerOpen && message.type === 'image' && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setImageViewerOpen(false)}
        >
          <img
            src={message.mediaURL ?? ''}
            alt="Full"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  )
}
