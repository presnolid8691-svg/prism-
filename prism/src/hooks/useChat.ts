'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { Message } from '@/types/message'
import { Chat } from '@/types/chat'

export function useChat(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [chat, setChat] = useState<Chat | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const uid = useAuthStore((s) => s.uid)
  const {
    optimisticMessages,
    confirmOptimisticMessage,
  } = useChatStore()

  const optimistic = optimisticMessages[chatId] ?? []

  useEffect(() => {
    if (!chatId) return

    // Subscribe to chat document (for typing, pinnedMessageId, theme, etc.)
    const chatDocRef = doc(db, 'chats', chatId)
    const unsubscribeChat = onSnapshot(
      chatDocRef,
      (snap) => {
        if (snap.exists()) {
          setChat({ id: snap.id, ...snap.data() } as Chat)
        }
      },
      (err) => console.error('[useChat] chat doc error:', err)
    )

    // Subscribe to messages ordered by sentAt asc
    const messagesRef = collection(db, 'chats', chatId, 'messages')
    const messagesQuery = query(messagesRef, orderBy('sentAt', 'asc'))

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snap) => {
        const fetched: Message[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Message[]

        // Reconcile optimistic messages: confirm any that have a matching localId
        fetched.forEach((realMsg) => {
          if (realMsg.localId) {
            const optimisticMatch = optimistic.find(
              (om) => om.localId === realMsg.localId
            )
            if (optimisticMatch && optimisticMatch.status === 'sending') {
              confirmOptimisticMessage(chatId, realMsg.localId, realMsg)
            }
          }
        })

        setMessages(fetched)
        setIsLoading(false)
      },
      (err) => {
        console.error('[useChat] messages error:', err)
        setIsLoading(false)
      }
    )

    return () => {
      unsubscribeChat()
      unsubscribeMessages()
    }
  }, [chatId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Merge confirmed real messages with still-pending optimistic messages
  const pendingOptimistic = optimistic.filter(
    (om) =>
      om.status === 'sending' || om.status === 'failed'
  )

  const mergedMessages: Message[] = [...messages, ...pendingOptimistic].sort(
    (a, b) => {
      const aTime = a.sentAt?.toMillis?.() ?? new Date(a.sentAt as any).getTime()
      const bTime = b.sentAt?.toMillis?.() ?? new Date(b.sentAt as any).getTime()
      return aTime - bTime
    }
  )

  return {
    messages: mergedMessages,
    isLoading,
    chat,
  }
}
