'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

const TYPING_DEBOUNCE_MS = 2000

interface UseTypingReturn {
  startTyping: () => void
  stopTyping: () => void
  typingUsers: string[]
}

export function useTyping(chatId: string, uid: string): UseTypingReturn {
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  // Subscribe to chat doc typing field
  useEffect(() => {
    if (!chatId || !uid) return

    const chatRef = doc(db, 'chats', chatId)
    const unsubscribe = onSnapshot(
      chatRef,
      (snap) => {
        if (snap.exists()) {
          const typingMap: Record<string, boolean> = snap.data()?.typing ?? {}
          const active = Object.entries(typingMap)
            .filter(([id, isTyping]) => isTyping && id !== uid)
            .map(([id]) => id)
          setTypingUsers(active)
        }
      },
      (err) => console.error('[useTyping] snapshot error:', err)
    )

    return () => unsubscribe()
  }, [chatId, uid])

  const stopTyping = useCallback(async () => {
    if (!chatId || !uid || !isTypingRef.current) return
    isTypingRef.current = false
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        [`typing.${uid}`]: false,
      })
    } catch (err) {
      console.error('[useTyping] stopTyping error:', err)
    }
  }, [chatId, uid])

  const startTyping = useCallback(() => {
    if (!chatId || !uid) return

    // Clear previous debounce timer
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)

    // Only write to Firestore if not already flagged as typing
    if (!isTypingRef.current) {
      isTypingRef.current = true
      updateDoc(doc(db, 'chats', chatId), {
        [`typing.${uid}`]: true,
      }).catch((err) => console.error('[useTyping] startTyping error:', err))
    }

    // Auto-stop after debounce period
    stopTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, TYPING_DEBOUNCE_MS)
  }, [chatId, uid, stopTyping])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)
      if (isTypingRef.current) {
        updateDoc(doc(db, 'chats', chatId), {
          [`typing.${uid}`]: false,
        }).catch(() => {})
      }
    }
  }, [chatId, uid])

  return { startTyping, stopTyping, typingUsers }
}
