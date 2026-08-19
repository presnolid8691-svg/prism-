'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  doc,
  serverTimestamp,
  query,
  limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { getChatId } from '@/lib/firebase/firestore'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { User } from '@/types/user'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  X,
  Lock,
  UserPlus,
  Loader2,
  ShieldAlert,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface NewChatDialogProps {
  open: boolean
  onClose: () => void
}

function getInitials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function NewChatDialog({ open, onClose }: NewChatDialogProps) {
  const { user } = useAuthStore()
  const { setSelectedChatId } = useChatStore()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [isSecretChat, setIsSecretChat] = useState(false)
  const [creatingUserId, setCreatingUserId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch users when dialog opens
  useEffect(() => {
    if (!open || !user?.uid) return

    let cancelled = false
    setLoading(true)

    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), limit(50))
        const snapshot = await getDocs(q)
        if (cancelled) return

        const userList: User[] = []
        snapshot.forEach((docSnap) => {
          if (docSnap.id !== user.uid) {
            userList.push({ uid: docSnap.id, ...docSnap.data() } as User)
          }
        })
        setUsers(userList)
      } catch (err) {
        console.error('[NewChatDialog] Error fetching users:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchUsers()

    return () => {
      cancelled = true
    }
  }, [open, user?.uid])

  // Focus search input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setSearch('')
      setIsSecretChat(false)
    }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users
    return users.filter(
      (u) =>
        u.displayName?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
    )
  }, [users, search])

  const handleStartChat = async (targetUser: User) => {
    if (!user?.uid || creatingUserId) return

    setCreatingUserId(targetUser.uid)
    try {
      const chatId = getChatId(user.uid, targetUser.uid)
      const chatDocRef = doc(db, 'chats', chatId)
      const chatSnap = await getDoc(chatDocRef)

      if (!chatSnap.exists()) {
        await setDoc(chatDocRef, {
          participants: [user.uid, targetUser.uid],
          createdAt: serverTimestamp(),
          lastMessage: null,
          pinnedMessageId: null,
          isSecretChat: isSecretChat,
          secretChatKeys: null,
          theme: null,
          wallpaperURL: null,
          unreadCount: {
            [user.uid]: 0,
            [targetUser.uid]: 0,
          },
          typing: {},
        })
      }

      setSelectedChatId(chatId)
      onClose()
    } catch (err) {
      console.error('[NewChatDialog] Error creating/opening chat:', err)
    } finally {
      setCreatingUserId(null)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base leading-tight">
                  New Conversation
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Select a contact to start chatting
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Secret Chat Toggle */}
          <button
            type="button"
            onClick={() => setIsSecretChat((prev) => !prev)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all mb-3 border',
              isSecretChat
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-5 h-5 rounded-md flex items-center justify-center transition-colors',
                  isSecretChat
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300'
                )}
              >
                <Lock className="h-3 w-3" />
              </div>
              <span>End-to-End Encrypted Secret Chat</span>
            </div>
            <span
              className={cn(
                'text-[11px] px-2 py-0.5 rounded-full font-semibold',
                isSecretChat
                  ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
              )}
            >
              {isSecretChat ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or username..."
              className="pl-9 pr-8 h-9 bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-sm focus-visible:ring-1 focus-visible:ring-blue-500 rounded-xl"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* User list */}
        <ScrollArea className="flex-1 p-2 max-h-[380px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
              <Loader2 className="h-7 w-7 animate-spin text-blue-500 mb-2" />
              <p className="text-xs">Loading contacts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <MessageSquare className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {search ? 'No users matched' : 'No other users found'}
              </p>
              <p className="text-xs text-zinc-400 mt-1 max-w-[220px]">
                {search
                  ? 'Check spelling or try searching another name'
                  : 'Invite your team members to join Prism!'}
              </p>
            </div>
          ) : (
            <div className="space-y-1 py-1">
              {filteredUsers.map((targetUser) => {
                const isSelected = creatingUserId === targetUser.uid
                const isOnline = targetUser.presence === 'online'

                return (
                  <button
                    key={targetUser.uid}
                    onClick={() => handleStartChat(targetUser)}
                    disabled={!!creatingUserId}
                    className={cn(
                      'w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group',
                      'hover:bg-zinc-100 dark:hover:bg-zinc-800/80 focus:outline-none focus:bg-zinc-100 dark:focus:bg-zinc-800',
                      isSelected && 'opacity-70 bg-zinc-50 dark:bg-zinc-800'
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-700">
                        <AvatarImage src={targetUser.photoURL ?? undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-semibold">
                          {getInitials(targetUser.displayName || targetUser.username || '')}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {targetUser.displayName || targetUser.username}
                        </p>
                        {isSecretChat && (
                          <Lock className="h-3 w-3 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        @{targetUser.username || targetUser.email?.split('@')[0]}
                        {targetUser.customStatus && ` • ${targetUser.customStatus}`}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      ) : (
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          Chat
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50/80 dark:bg-zinc-900/80 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            Fast, secure messaging
          </span>
          <span>{filteredUsers.length} contact{filteredUsers.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  )
}
