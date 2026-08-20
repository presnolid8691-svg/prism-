'use client'

import { useCallback } from 'react'
import {
  collection,
  doc,
  writeBatch,
  arrayUnion,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

interface UseReadReceiptsReturn {
  markAsRead: (messageIds: string[]) => Promise<void>
  markDelivered: (messageIds: string[]) => Promise<void>
}

export function useReadReceipts(chatId: string, uid: string): UseReadReceiptsReturn {
  const markAsRead = useCallback(
    async (messageIds: string[]) => {
      if (!chatId || !uid || messageIds.length === 0) return
      try {
        const batch = writeBatch(db)
        messageIds.forEach((msgId) => {
          const msgRef = doc(db, 'chats', chatId, 'messages', msgId)
          batch.update(msgRef, {
            readBy: arrayUnion(uid),
          })
        })
        await batch.commit()
      } catch (err) {
        console.error('[useReadReceipts] markAsRead error:', err)
      }
    },
    [chatId, uid]
  )

  const markDelivered = useCallback(
    async (messageIds: string[]) => {
      if (!chatId || !uid || messageIds.length === 0) return
      try {
        const batch = writeBatch(db)
        messageIds.forEach((msgId) => {
          const msgRef = doc(db, 'chats', chatId, 'messages', msgId)
          batch.update(msgRef, {
            deliveredTo: arrayUnion(uid),
          })
        })
        await batch.commit()
      } catch (err) {
        console.error('[useReadReceipts] markDelivered error:', err)
      }
    },
    [chatId, uid]
  )

  return { markAsRead, markDelivered }
}
