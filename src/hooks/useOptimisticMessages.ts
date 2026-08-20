'use client'

import { useCallback } from 'react'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { Message } from '@/types/message'
import { generateId } from '@/lib/utils/generateId'

interface MessageExtras {
  mediaURL?: string | null
  mediaMeta?: Message['mediaMeta']
  gifURL?: string | null
  linkPreview?: Message['linkPreview']
  replyTo?: Message['replyTo']
  threadId?: string | null
  selfDestruct?: Message['selfDestruct']
}

interface UseOptimisticMessagesReturn {
  optimisticMessages: Message[]
  sendOptimisticMessage: (
    content: string,
    type: Message['type'],
    extras?: MessageExtras
  ) => Promise<void>
}

export function useOptimisticMessages(chatId: string): UseOptimisticMessagesReturn {
  const uid = useAuthStore((s) => s.uid)
  const {
    optimisticMessages,
    addOptimisticMessage,
    failOptimisticMessage,
  } = useChatStore()

  const chatOptimistic = optimisticMessages[chatId] ?? []

  const sendOptimisticMessage = useCallback(
    async (
      content: string,
      type: Message['type'] = 'text',
      extras: MessageExtras = {}
    ) => {
      if (!uid || !chatId) return

      const localId = generateId()
      const now = Timestamp.now()

      const optimisticMsg: Message = {
        id: localId,
        localId,
        senderId: uid,
        type,
        content,
        isEncrypted: false,
        mediaURL: extras.mediaURL ?? null,
        mediaMeta: extras.mediaMeta ?? null,
        gifURL: extras.gifURL ?? null,
        linkPreview: extras.linkPreview ?? null,
        replyTo: extras.replyTo ?? null,
        threadId: extras.threadId ?? null,
        reactions: {},
        readBy: [uid],
        deliveredTo: [uid],
        selfDestruct: extras.selfDestruct ?? null,
        isPinned: false,
        sentAt: now,
        editedAt: null,
        deletedAt: null,
        status: 'sending',
      }

      // 1. Add to optimistic state immediately
      addOptimisticMessage(chatId, optimisticMsg)

      try {
        // 2. Write to Firestore
        const messagesRef = collection(db, 'chats', chatId, 'messages')
        await addDoc(messagesRef, {
          localId,
          senderId: uid,
          type,
          content,
          isEncrypted: false,
          mediaURL: extras.mediaURL ?? null,
          mediaMeta: extras.mediaMeta ?? null,
          gifURL: extras.gifURL ?? null,
          linkPreview: extras.linkPreview ?? null,
          replyTo: extras.replyTo ?? null,
          threadId: extras.threadId ?? null,
          reactions: {},
          readBy: [uid],
          deliveredTo: [uid],
          selfDestruct: extras.selfDestruct ?? null,
          isPinned: false,
          sentAt: serverTimestamp(),
          editedAt: null,
          deletedAt: null,
        })

        // 3. Update chat lastMessage
        const chatRef = doc(db, 'chats', chatId)
        await updateDoc(chatRef, {
          lastMessage: {
            content: type === 'text' ? content : `[${type}]`,
            senderId: uid,
            sentAt: serverTimestamp(),
            type,
          },
          [`unreadCount.${uid}`]: 0,
        }).catch(() => {})
      } catch (err) {
        console.error('[useOptimisticMessages] send error:', err)
        // 4. Mark as failed
        failOptimisticMessage(chatId, localId)
      }
    },
    [uid, chatId, addOptimisticMessage, failOptimisticMessage]
  )

  return {
    optimisticMessages: chatOptimistic,
    sendOptimisticMessage,
  }
}
