'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
  limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { Message } from '@/types/message'
import { Chat } from '@/types/chat'
import { User } from '@/types/user'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import { PinnedMessageBanner } from './PinnedMessageBanner'
import { SecretChatBanner } from './SecretChatBanner'
import { MediaGalleryDrawer } from './MediaGalleryDrawer'
import { ThreadView } from './ThreadView'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateSeparator } from '@/lib/utils/formatTime'
import {
  Phone,
  Video,
  MoreVertical,
  Images,
  ArrowLeft,
  Info,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils/cn'
import { ChatThemePicker } from './ChatThemePicker'

interface ChatWindowProps {
  chatId: string
  onBack?: () => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function isSameDay(a: Timestamp | null, b: Timestamp | null): boolean {
  if (!a || !b) return false
  const da = a.toDate()
  const db2 = b.toDate()
  return (
    da.getFullYear() === db2.getFullYear() &&
    da.getMonth() === db2.getMonth() &&
    da.getDate() === db2.getDate()
  )
}

export function ChatWindow({ chatId, onBack }: ChatWindowProps) {
  const { user } = useAuthStore()
  const { optimisticMessages, addOptimisticMessage, removeOptimisticMessage } = useChatStore()

  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null)
  const [pinnedDismissed, setPinnedDismissed] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [mediaGalleryOpen, setMediaGalleryOpen] = useState(false)
  const [themePickerOpen, setThemePickerOpen] = useState(false)
  const [threadMessageId, setThreadMessageId] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const optimisticLocal = optimisticMessages[chatId] ?? []

  // Subscribe to chat doc
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'chats', chatId), async (snap) => {
      if (!snap.exists()) return
      const chatData = { id: snap.id, ...snap.data() } as Chat
      setChat(chatData)

      // Resolve other user
      const otherUid = chatData.participants.find((p) => p !== user?.uid)
      if (otherUid) {
        const uSnap = await getDoc(doc(db, 'users', otherUid))
        if (uSnap.exists()) {
          setOtherUser({ uid: otherUid, ...uSnap.data() } as User)
        }
      }

      // Typing indicator
      const typing = chatData.typing ?? {}
      const typers = Object.entries(typing)
        .filter(([uid, val]) => uid !== user?.uid && val === true)
        .map(([uid]) => uid)
      setTypingUsers(typers)
    })
    return () => unsub()
  }, [chatId, user?.uid])

  // Subscribe to messages
  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('sentAt', 'asc'),
      limit(200)
    )
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message))
      setMessages(msgs)
      setLoading(false)
    })
    return () => unsub()
  }, [chatId])

  // Fetch pinned message when chat.pinnedMessageId changes
  useEffect(() => {
    if (!chat?.pinnedMessageId || pinnedDismissed) {
      setPinnedMessage(null)
      return
    }
    getDoc(doc(db, 'chats', chatId, 'messages', chat.pinnedMessageId)).then((s) => {
      if (s.exists()) setPinnedMessage({ id: s.id, ...s.data() } as Message)
    })
  }, [chat?.pinnedMessageId, chatId, pinnedDismissed])

  // Mark messages as read
  useEffect(() => {
    if (!user?.uid || messages.length === 0) return
    const unread = messages.filter(
      (m) => m.senderId !== user.uid && !m.readBy.includes(user.uid)
    )
    unread.forEach((m) => {
      updateDoc(doc(db, 'chats', chatId, 'messages', m.id), {
        readBy: arrayUnion(user.uid),
      }).catch(() => {})
    })
  }, [messages, user?.uid, chatId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, optimisticLocal.length])

  // Merge optimistic + real messages, reconcile by localId
  const allMessages = useCallback(() => {
    const realIds = new Set(messages.map((m) => m.localId).filter(Boolean))
    const unconfirmed = optimisticLocal.filter((om) => !realIds.has(om.localId))
    return [...messages, ...unconfirmed] as Message[]
  }, [messages, optimisticLocal])

  const handleSend = useCallback(
    async (
      content: string,
      type: Message['type'],
      extras?: Partial<Message>
    ) => {
      if (!user?.uid) return
      const localId = crypto.randomUUID()
      const optimistic: Message = {
        id: localId,
        localId,
        senderId: user.uid,
        type,
        content,
        isEncrypted: false,
        mediaURL: extras?.mediaURL ?? null,
        mediaMeta: extras?.mediaMeta ?? null,
        gifURL: extras?.gifURL ?? null,
        linkPreview: extras?.linkPreview ?? null,
        replyTo: replyTo
          ? {
              messageId: replyTo.id,
              senderName: otherUser?.displayName ?? 'Unknown',
              contentPreview: replyTo.content.slice(0, 80),
            }
          : null,
        threadId: null,
        reactions: {},
        readBy: [],
        deliveredTo: [],
        selfDestruct: extras?.selfDestruct ?? null,
        isPinned: false,
        sentAt: Timestamp.now(),
        editedAt: null,
        deletedAt: null,
        status: 'sending',
        ...extras,
      }
      addOptimisticMessage(chatId, optimistic)
      setReplyTo(null)
    },
    [user?.uid, chatId, replyTo, otherUser, addOptimisticMessage]
  )

  const handleReact = useCallback(
    async (msgId: string, emoji: string) => {
      if (!user?.uid) return
      const msgRef = doc(db, 'chats', chatId, 'messages', msgId)
      await updateDoc(msgRef, {
        [`reactions.${emoji}`]: arrayUnion(user.uid),
      })
    },
    [chatId, user?.uid]
  )

  const combined = allMessages()

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn('flex gap-2', i % 2 === 0 ? '' : 'justify-end')}>
              {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
              <Skeleton className={cn('h-10 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-36')} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const wallpaperStyle = chat?.wallpaperURL
    ? { backgroundImage: `url(${chat.wallpaperURL})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-zinc-200 bg-white shrink-0">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-9 w-9">
          <AvatarImage src={otherUser?.photoURL ?? undefined} />
          <AvatarFallback className="bg-zinc-200 text-zinc-700 text-xs font-medium">
            {otherUser ? getInitials(otherUser.displayName) : '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 truncate">
            {otherUser?.displayName ?? 'Loading...'}
          </p>
          <p className="text-xs text-zinc-400">
            {otherUser?.presence === 'online' ? (
              <span className="text-green-500 font-medium">Online</span>
            ) : (
              otherUser?.customStatus || 'Offline'
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50"
            title="Voice call"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50"
            title="Video call"
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMediaGalleryOpen(true)}
            className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50"
            title="Media gallery"
          >
            <Images className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setThemePickerOpen(true)}>
                Chat theme &amp; wallpaper
              </DropdownMenuItem>
              <DropdownMenuItem>Search in conversation</DropdownMenuItem>
              <DropdownMenuItem>Mute notifications</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Block user</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Banners */}
      {chat?.isSecretChat && <SecretChatBanner isSecretChat />}
      {pinnedMessage && !pinnedDismissed && (
        <PinnedMessageBanner
          message={pinnedMessage}
          onDismiss={() => setPinnedDismissed(true)}
          onClick={() => {
            // scroll to message — simplified for now
          }}
        />
      )}

      {/* Messages area */}
      <ScrollArea className="flex-1 relative" ref={scrollRef as React.RefObject<HTMLDivElement>}>
        <div
          className="px-4 py-3 space-y-1 min-h-full"
          style={wallpaperStyle}
        >
          {combined.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-sm text-zinc-400">No messages yet. Say hello! 👋</p>
            </div>
          ) : (
            combined.map((msg, idx) => {
              const prev = combined[idx - 1] ?? null
              const showDateSep =
                idx === 0 || !isSameDay(prev?.sentAt ?? null, msg.sentAt ?? null)
              const isOwn = msg.senderId === user?.uid
              const showAvatar = !isOwn && (idx === 0 || combined[idx - 1]?.senderId !== msg.senderId)

              return (
                <div key={msg.localId ?? msg.id}>
                  {showDateSep && (
                    <div className="flex items-center justify-center my-3">
                      <span className="text-xs text-zinc-400 bg-white/80 backdrop-blur-sm px-3 py-0.5 rounded-full border border-zinc-200">
                        {formatDateSeparator(msg.sentAt)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    senderUser={!isOwn ? otherUser : null}
                    onReply={() => setReplyTo(msg)}
                    onReact={(msgId, emoji) => handleReact(msgId, emoji)}
                    onOpenThread={(msgId) => setThreadMessageId(msgId)}
                  />
                </div>
              )
            })
          )}
          {typingUsers.length > 0 && otherUser && (
            <TypingIndicator typingUsers={[otherUser.displayName]} />
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 border-t border-zinc-200 bg-white">
        <MessageInput
          chatId={chatId}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onSend={handleSend}
        />
      </div>

      {/* Drawers */}
      <MediaGalleryDrawer
        chatId={chatId}
        open={mediaGalleryOpen}
        onClose={() => setMediaGalleryOpen(false)}
      />
      {themePickerOpen && (
        <ChatThemePicker chatId={chatId} onClose={() => setThemePickerOpen(false)} />
      )}
      {threadMessageId && (
        <ThreadView
          chatId={chatId}
          threadMessageId={threadMessageId}
          onClose={() => setThreadMessageId(null)}
        />
      )}
    </div>
  )
}
