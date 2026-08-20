'use client'

import { Chat } from '@/types/chat'
import { User } from '@/types/user'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'
import { formatMessageTime } from '@/lib/utils/formatTime'
import { Lock } from 'lucide-react'

interface ChatListItemProps {
  chat: Chat
  otherUser: User
  isActive: boolean
  onClick: () => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ChatListItem({ chat, otherUser, isActive, onClick }: ChatListItemProps) {
  const isTyping = chat.typing?.[otherUser.uid] === true
  const unread = chat.unreadCount?.[otherUser.uid] ?? 0

  const lastPreview = isTyping
    ? null
    : chat.lastMessage?.text ?? null

  const lastTime = chat.lastMessage?.sentAt
    ? formatMessageTime(chat.lastMessage.sentAt)
    : null

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50',
        isActive && 'bg-blue-50 border-l-2 border-blue-600'
      )}
    >
      {/* Avatar with presence dot */}
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser.photoURL ?? undefined} alt={otherUser.displayName} />
          <AvatarFallback className="bg-zinc-200 text-zinc-700 text-sm font-medium">
            {getInitials(otherUser.displayName)}
          </AvatarFallback>
        </Avatar>
        {otherUser.presence === 'online' && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <span
              className={cn(
                'text-sm font-medium truncate',
                isActive ? 'text-blue-900' : 'text-zinc-900'
              )}
            >
              {otherUser.displayName}
            </span>
            {chat.isSecretChat && (
              <Lock className="h-3 w-3 text-zinc-400 shrink-0" />
            )}
          </div>
          {lastTime && (
            <span className="text-xs text-zinc-400 shrink-0">{lastTime}</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-1 mt-0.5">
          {isTyping ? (
            <span className="text-xs text-zinc-400 italic">typing...</span>
          ) : lastPreview ? (
            <span className="text-xs text-zinc-500 truncate">{lastPreview}</span>
          ) : (
            <span className="text-xs text-zinc-400 italic">No messages yet</span>
          )}

          {unread > 0 && (
            <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center px-1">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
