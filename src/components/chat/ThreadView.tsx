'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { Message } from '@/types/message'
import { User } from '@/types/user'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMessageTime, formatDateSeparator } from '@/lib/utils/formatTime'
import { cn } from '@/lib/utils/cn'
import {
  X,
  Send,
  CornerDownRight,
  Smile,
  MessageSquare,
  Sparkles,
  Flame,
  Check,
  CheckCheck,
} from 'lucide-react'

export interface ThreadViewProps {
  chatId: string
  threadMessageId: string
  onClose: () => void
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * ThreadView side drawer showing parent message and dedicated thread replies.
 */
export function ThreadView({
  chatId,
  threadMessageId,
  onClose,
  className,
}: ThreadViewProps) {
  const { user } = useAuthStore()

  const [parentMessage, setParentMessage] = useState<Message | null>(null)
  const [parentAuthor, setParentAuthor] = useState<User | null>(null)
  const [replies, setReplies] = useState<Message[]>([])
  const [authorsMap, setAuthorsMap] = useState<Record<string, User>>({})
  const [loadingParent, setLoadingParent] = useState(true)
  const [loadingReplies, setLoadingReplies] = useState(true)
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch parent message
  useEffect(() => {
    if (!chatId || !threadMessageId) return
    setLoadingParent(true)

    const unsub = onSnapshot(
      doc(db, 'chats', chatId, 'messages', threadMessageId),
      async (snap) => {
        if (snap.exists()) {
          const msgData = { id: snap.id, ...snap.data() } as Message
          setParentMessage(msgData)

          // Fetch author
          if (msgData.senderId) {
            try {
              const uSnap = await getDoc(doc(db, 'users', msgData.senderId))
              if (uSnap.exists()) {
                setParentAuthor({ uid: uSnap.id, ...uSnap.data() } as User)
              }
            } catch (err) {
              console.error('[ThreadView] Failed to fetch parent author:', err)
            }
          }
        }
        setLoadingParent(false)
      }
    )

    return () => unsub()
  }, [chatId, threadMessageId])

  // Subscribe to thread replies
  useEffect(() => {
    if (!chatId || !threadMessageId) return
    setLoadingReplies(true)

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      where('threadId', '==', threadMessageId)
    )

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const msgs = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Message)
        )

        // Sort by sentAt ascending
        msgs.sort((a, b) => {
          const timeA = a.sentAt?.toDate?.()?.getTime() ?? 0
          const timeB = b.sentAt?.toDate?.()?.getTime() ?? 0
          return timeA - timeB
        })

        setReplies(msgs)
        setLoadingReplies(false)

        // Fetch authors for new replies
        const missingUserIds = msgs
          .map((m) => m.senderId)
          .filter((uid) => uid && !authorsMap[uid])

        const uniqueMissing = Array.from(new Set(missingUserIds))
        if (uniqueMissing.length > 0) {
          const newMap = { ...authorsMap }
          await Promise.all(
            uniqueMissing.map(async (uid) => {
              try {
                const uSnap = await getDoc(doc(db, 'users', uid))
                if (uSnap.exists()) {
                  newMap[uid] = { uid: uSnap.id, ...uSnap.data() } as User
                }
              } catch (err) {
                console.error('[ThreadView] user fetch error:', err)
              }
            })
          )
          setAuthorsMap(newMap)
        }
      },
      (err) => {
        console.error('[ThreadView] replies snapshot error:', err)
        setLoadingReplies(false)
      }
    )

    return () => unsub()
  }, [chatId, threadMessageId])

  // Auto-scroll on replies change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [replies.length])

  // Handle reaction on thread message
  const handleReact = async (msgId: string, emoji: string) => {
    if (!user?.uid || !chatId) return
    try {
      const msgRef = doc(db, 'chats', chatId, 'messages', msgId)
      await updateDoc(msgRef, {
        [`reactions.${emoji}`]: arrayUnion(user.uid),
      })
    } catch (err) {
      console.error('[ThreadView] handleReact error:', err)
    }
  }

  // Handle send reply
  const handleSendReply = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      const text = inputText.trim()
      if (!text || !user?.uid || !chatId || isSending) return

      setIsSending(true)
      try {
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          senderId: user.uid,
          type: 'text',
          content: text,
          isEncrypted: false,
          mediaURL: null,
          mediaMeta: null,
          gifURL: null,
          linkPreview: null,
          replyTo: parentMessage
            ? {
                messageId: parentMessage.id,
                senderName: parentAuthor?.displayName ?? 'Original message',
                contentPreview: parentMessage.content.slice(0, 80),
              }
            : null,
          threadId: threadMessageId,
          reactions: {},
          readBy: [user.uid],
          deliveredTo: [],
          selfDestruct: null,
          isPinned: false,
          sentAt: Timestamp.now(),
          editedAt: null,
          deletedAt: null,
          status: 'sent',
        })

        setInputText('')
        inputRef.current?.focus()
      } catch (err) {
        console.error('[ThreadView] sendReply error:', err)
      } finally {
        setIsSending(false)
      }
    },
    [inputText, user?.uid, chatId, threadMessageId, parentMessage, parentAuthor, isSending]
  )

  return (
    <div
      className={cn(
        'fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Thread</h2>
          <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full font-medium">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          title="Close thread"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content Area */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-4">
          {/* Parent Message Card */}
          {loadingParent ? (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-2 border border-zinc-200/60 dark:border-zinc-700/60">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : parentMessage ? (
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs">
              <div className="flex items-center gap-2.5 mb-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={parentAuthor?.photoURL ?? undefined} />
                  <AvatarFallback className="text-xs font-semibold bg-zinc-200 text-zinc-700">
                    {parentAuthor ? getInitials(parentAuthor.displayName) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {parentAuthor?.displayName ?? 'User'}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {formatMessageTime(parentMessage.sentAt)}
                  </p>
                </div>
              </div>

              <div className="text-sm text-zinc-800 dark:text-zinc-200 break-words whitespace-pre-wrap leading-relaxed">
                {parentMessage.content}
              </div>

              {/* Parent Reactions */}
              {Object.keys(parentMessage.reactions ?? {}).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {Object.entries(parentMessage.reactions).map(([emoji, uids]) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(parentMessage.id, emoji)}
                      className="flex items-center gap-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-2 py-0.5"
                    >
                      <span>{emoji}</span>
                      <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        {uids.length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic">Parent message unavailable</p>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
            <span className="absolute bg-white dark:bg-zinc-900 px-3 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Replies
            </span>
          </div>

          {/* Replies list */}
          {loadingReplies ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-2.5">
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : replies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-400">
              <CornerDownRight className="h-8 w-8 stroke-1 mb-2 opacity-60 text-blue-500" />
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">No replies yet</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Start the conversation in this thread below.</p>
            </div>
          ) : (
            replies.map((reply) => {
              const isOwn = reply.senderId === user?.uid
              const replyAuthor = authorsMap[reply.senderId] ?? (isOwn ? user : null)

              return (
                <div
                  key={reply.id}
                  className={cn(
                    'flex gap-2.5 group/msg',
                    isOwn ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                    <AvatarImage src={replyAuthor?.photoURL ?? undefined} />
                    <AvatarFallback className="text-[10px] font-semibold bg-zinc-200 text-zinc-700">
                      {replyAuthor ? getInitials(replyAuthor.displayName) : '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn('flex flex-col max-w-[80%]', isOwn ? 'items-end' : 'items-start')}>
                    <div className="flex items-center gap-1.5 px-1 mb-0.5">
                      <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 truncate">
                        {isOwn ? 'You' : replyAuthor?.displayName ?? 'User'}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {formatMessageTime(reply.sentAt)}
                      </span>
                    </div>

                    <div
                      className={cn(
                        'px-3 py-2 rounded-2xl text-xs leading-relaxed break-words whitespace-pre-wrap',
                        isOwn
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-xs'
                      )}
                    >
                      {reply.content}
                    </div>

                    {/* Reactions */}
                    {Object.keys(reply.reactions ?? {}).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(reply.reactions).map(([emoji, uids]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(reply.id, emoji)}
                            className="flex items-center gap-0.5 text-[10px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-1.5 py-0.5"
                          >
                            <span>{emoji}</span>
                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                              {uids.length}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <form
        onSubmit={handleSendReply}
        className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0"
      >
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Reply in thread..."
            className="flex-1 bg-transparent border-0 focus:outline-none text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 py-1"
          />

          <Button
            type="submit"
            size="sm"
            disabled={!inputText.trim() || isSending}
            className="h-7 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shrink-0 text-xs font-medium"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ThreadView
