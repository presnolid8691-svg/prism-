'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  limit,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  actionUrl: string | null
  senderId: string | null
  createdAt: any
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  markNotificationRead: (notifId: string) => Promise<void>
  isLoading: boolean
}

export function useNotifications(uid: string): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!uid) return

    const notificationsRef = collection(db, 'users', uid, 'notifications')
    const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(50))

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const fetched = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Notification[]

        const unread = fetched.filter((n) => !n.isRead).length

        setNotifications(fetched)
        setUnreadCount(unread)
        setIsLoading(false)
      },
      (err) => {
        console.error('[useNotifications] error:', err)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [uid])

  const markNotificationRead = useCallback(
    async (notifId: string) => {
      if (!uid || !notifId) return
      try {
        const notifRef = doc(db, 'users', uid, 'notifications', notifId)
        await updateDoc(notifRef, {
          isRead: true,
          readAt: serverTimestamp(),
        })
      } catch (err) {
        console.error('[useNotifications] markRead error:', err)
      }
    },
    [uid]
  )

  return { notifications, unreadCount, markNotificationRead, isLoading }
}
