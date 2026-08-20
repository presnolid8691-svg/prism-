'use client'

import { useEffect } from 'react'
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useNotificationStore } from '@/store/notificationStore'

interface UseUnreadCountsReturn {
  unreadCounts: Record<string, number>
  totalUnread: number
}

export function useUnreadCounts(uid: string): UseUnreadCountsReturn {
  const { unreadCounts, totalUnread, setUnreadCount } = useNotificationStore()

  useEffect(() => {
    if (!uid) return

    const chatsRef = collection(db, 'chats')
    const q = query(chatsRef, where('participants', 'array-contains', uid))

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        snap.docs.forEach((d) => {
          const data = d.data()
          const count: number = data?.unreadCount?.[uid] ?? 0
          setUnreadCount(d.id, count)
        })
      },
      (err) => console.error('[useUnreadCounts] error:', err)
    )

    return () => unsubscribe()
  }, [uid, setUnreadCount])

  return { unreadCounts, totalUnread }
}
