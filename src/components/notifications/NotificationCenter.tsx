'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  MessageSquare,
  Heart,
  UserPlus,
  AtSign,
  Phone,
  Eye,
  CheckCheck,
  Trash2,
  Settings,
  Sparkles,
  HelpCircle,
  Clock,
  Check,
  Radio,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { db } from '@/lib/firebase/config'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { User } from '@/types/user'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatStoryTime } from '@/lib/utils/formatTime'
import { cn } from '@/lib/utils/cn'

interface NotificationItem {
  id: string
  type: 'message' | 'reaction' | 'follow' | 'story_view' | 'mention' | 'qa_answer' | 'call' | string
  title?: string
  body?: string
  preview?: string
  fromUid?: string
  senderId?: string
  entityId?: string
  actionUrl?: string | null
  isRead?: boolean
  read?: boolean
  createdAt?: any
}

export function NotificationCenter() {
  const router = useRouter()
  const { user, uid } = useAuthStore()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'messages' | 'reactions' | 'follows'>('all')
  const [senderCache, setSenderCache] = useState<Record<string, User>>({})

  // Subscribe to user notifications in Firestore
  useEffect(() => {
    if (!uid) return

    const notifRef = collection(db, 'users', uid, 'notifications')
    const q = query(notifRef, orderBy('createdAt', 'desc'), limit(50))

    const unsubscribe = onSnapshot(
      q,
      async (snap) => {
        const list: NotificationItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))

        setNotifications(list)
        setLoading(false)

        // Resolve sender avatars in background
        const missingUids = list
          .map((n) => n.fromUid || n.senderId)
          .filter((id): id is string => !!id && !senderCache[id])

        if (missingUids.length > 0) {
          const newCache = { ...senderCache }
          for (const sUid of missingUids.slice(0, 10)) {
            try {
              const uSnap = await getDoc(doc(db, 'users', sUid))
              if (uSnap.exists()) {
                newCache[sUid] = { uid: uSnap.id, ...uSnap.data() } as User
              }
            } catch {
              // ignore
            }
          }
          setSenderCache(newCache)
        }
      },
      (err) => {
        console.error('Error fetching notifications:', err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [uid])

  // Mark single notification read
  const markAsRead = async (notif: NotificationItem) => {
    if (!uid || notif.isRead || notif.read) return
    try {
      await updateDoc(doc(db, 'users', uid, 'notifications', notif.id), {
        isRead: true,
        read: true,
        readAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Error marking read:', err)
    }
  }

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (!uid || notifications.length === 0) return
    try {
      const batch = writeBatch(db)
      const unreadList = notifications.filter((n) => !n.isRead && !n.read)
      unreadList.forEach((n) => {
        const ref = doc(db, 'users', uid, 'notifications', n.id)
        batch.update(ref, { isRead: true, read: true, readAt: serverTimestamp() })
      })
      await batch.commit()
    } catch (err) {
      console.error('Error marking all read:', err)
    }
  }

  // Delete a notification
  const handleDeleteNotification = async (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!uid) return
    try {
      await deleteDoc(doc(db, 'users', uid, 'notifications', notifId))
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  // Handle notification click navigation
  const handleNotificationClick = async (notif: NotificationItem) => {
    await markAsRead(notif)
    if (notif.actionUrl) {
      router.push(notif.actionUrl)
    } else if (notif.type === 'message' && notif.entityId) {
      router.push(`/chats/${notif.entityId}`)
    } else if (notif.type === 'follow' && (notif.fromUid || notif.senderId)) {
      router.push(`/profile/${notif.fromUid || notif.senderId}`)
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length

  // Filter based on active tab
  const filteredNotifications = notifications.filter((n) => {
    const isUnread = !n.isRead && !n.read
    if (activeTab === 'unread') return isUnread
    if (activeTab === 'messages') return n.type === 'message' || n.type === 'mention'
    if (activeTab === 'reactions') return n.type === 'reaction'
    if (activeTab === 'follows') return n.type === 'follow' || n.type === 'story_view'
    return true
  })

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'reaction':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
      case 'follow':
        return <UserPlus className="w-4 h-4 text-emerald-500" />
      case 'mention':
        return <AtSign className="w-4 h-4 text-indigo-500" />
      case 'call':
        return <Phone className="w-4 h-4 text-emerald-500" />
      case 'story_view':
        return <Eye className="w-4 h-4 text-sky-500" />
      case 'qa_answer':
        return <HelpCircle className="w-4 h-4 text-purple-500" />
      default:
        return <Bell className="w-4 h-4 text-zinc-500" />
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-zinc-900">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <Badge variant="default" className="text-xs">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Activity, mentions, reactions, and direct messages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                Mark all read
              </Button>
            )}
            <Link href="/settings/notifications">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                title="Notification Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
              activeTab === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            )}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5',
              activeTab === 'unread'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            )}
          >
            Unread
            {unreadCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5',
              activeTab === 'messages'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Messages
          </button>
          <button
            onClick={() => setActiveTab('reactions')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5',
              activeTab === 'reactions'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            )}
          >
            <Heart className="w-3.5 h-3.5" />
            Reactions
          </button>
          <button
            onClick={() => setActiveTab('follows')}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5',
              activeTab === 'follows'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            )}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Follows
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-2">
          {loading ? (
            <div className="py-20 text-center text-sm text-zinc-500">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                {activeTab === 'unread'
                  ? "You're all caught up! Great job staying on top of messages."
                  : 'When someone sends you a message, reacts to a post, or starts a call, it will show up here.'}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden shadow-sm">
              {filteredNotifications.map((notif) => {
                const isUnread = !notif.isRead && !notif.read
                const senderUid = notif.fromUid || notif.senderId
                const sender = senderUid ? senderCache[senderUid] : null
                const timeAgo = notif.createdAt ? formatStoryTime(notif.createdAt) : 'just now'
                const displayTitle = notif.title || (sender?.displayName ? `${sender.displayName}` : 'New Notification')
                const displayBody = notif.body || notif.preview || 'Interacted with your account'

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      'p-4 flex items-start justify-between gap-4 cursor-pointer transition-colors group',
                      isUnread
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    )}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Avatar with Type Icon Badge */}
                      <div className="relative shrink-0 mt-0.5">
                        <Avatar className="w-10 h-10 border border-zinc-200 dark:border-zinc-700">
                          <AvatarImage src={sender?.photoURL || ''} />
                          <AvatarFallback className="text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {sender?.displayName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs">
                          {getNotificationIcon(notif.type)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {displayTitle}
                          </p>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 line-clamp-2">
                          {displayBody}
                        </p>

                        <span className="text-[11px] text-zinc-400 mt-1 block">
                          {timeAgo}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteNotification(notif.id, e)}
                        className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

