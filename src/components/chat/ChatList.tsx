'use client'

import { useEffect, useState, useRef } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { Chat } from '@/types/chat'
import { User } from '@/types/user'
import { ChatListItem } from './ChatListItem'
import { ChatListSkeleton } from './ChatListSkeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Search, Plus, X } from 'lucide-react'
import { NewChatDialog } from './NewChatDialog'

interface ChatWithUser {
  chat: Chat
  otherUser: User
}

export function ChatList() {
  const { user } = useAuthStore()
  const { selectedChatId, setSelectedChatId } = useChatStore()
  const [chats, setChats] = useState<ChatWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [newChatOpen, setNewChatOpen] = useState(false)
  const userCache = useRef<Record<string, User>>({})

  useEffect(() => {
    if (!user?.uid) return

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(q, async (snapshot) => {
      const chatDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Chat))

      const resolved: ChatWithUser[] = []
      for (const chat of chatDocs) {
        const otherUid = chat.participants.find((p) => p !== user.uid)
        if (!otherUid) continue

        if (!userCache.current[otherUid]) {
          try {
            const userSnap = await getDoc(doc(db, 'users', otherUid))
            if (userSnap.exists()) {
              userCache.current[otherUid] = { uid: otherUid, ...userSnap.data() } as User
            }
          } catch {
            continue
          }
        }

        const otherUser = userCache.current[otherUid]
        if (otherUser) {
          resolved.push({ chat, otherUser })
        }
      }

      // Sort by lastMessage.sentAt desc, fall back to createdAt
      resolved.sort((a, b) => {
        const aTime = a.chat.lastMessage?.sentAt?.toMillis?.() ?? a.chat.createdAt?.toMillis?.() ?? 0
        const bTime = b.chat.lastMessage?.sentAt?.toMillis?.() ?? b.chat.createdAt?.toMillis?.() ?? 0
        return bTime - aTime
      })

      setChats(resolved)
      setLoading(false)
    })

    return () => unsub()
  }, [user?.uid])

  const filtered = search.trim()
    ? chats.filter((c) =>
        c.otherUser.displayName.toLowerCase().includes(search.toLowerCase()) ||
        c.otherUser.username.toLowerCase().includes(search.toLowerCase())
      )
    : chats

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-zinc-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-zinc-900">Messages</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNewChatOpen(true)}
            className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9 pr-8 h-9 bg-zinc-50 border-zinc-200 text-sm focus-visible:ring-1 focus-visible:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <ChatListSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
              <MessageSquare className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-700">
              {search ? 'No chats found' : 'No conversations yet'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {search ? 'Try a different search' : 'Start a new chat'}
            </p>
            {!search && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewChatOpen(true)}
                className="mt-4 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Chat
              </Button>
            )}
          </div>
        ) : (
          <div className="py-1">
            {filtered.map(({ chat, otherUser }) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                otherUser={otherUser}
                isActive={selectedChatId === chat.id}
                onClick={() => setSelectedChatId(chat.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <NewChatDialog open={newChatOpen} onClose={() => setNewChatOpen(false)} />
    </div>
  )
}
