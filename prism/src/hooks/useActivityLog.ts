'use client'

import { useCallback, useRef } from 'react'
import {
  doc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

const MIN_LOG_INTERVAL_MS = 30_000 // max once per 30s

interface UseActivityLogReturn {
  logActivity: () => void
}

function getTodayKey(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function useActivityLog(uid: string): UseActivityLogReturn {
  const lastLoggedRef = useRef<number>(0)

  const logActivity = useCallback(() => {
    if (!uid) return

    const now = Date.now()
    // Throttle: ignore calls within MIN_LOG_INTERVAL_MS of last log
    if (now - lastLoggedRef.current < MIN_LOG_INTERVAL_MS) return
    lastLoggedRef.current = now

    const todayKey = getTodayKey()
    const activityRef = doc(db, 'users', uid, 'activityLog', todayKey)

    // Fire and forget: upsert using setDoc with merge
    ;(async () => {
      try {
        const snap = await getDoc(activityRef)
        if (snap.exists()) {
          await updateDoc(activityRef, {
            actionCount: increment(1),
            lastUpdated: serverTimestamp(),
          })
        } else {
          await setDoc(activityRef, {
            date: todayKey,
            actionCount: 1,
            lastUpdated: serverTimestamp(),
          })
        }
      } catch (err) {
        console.error('[useActivityLog] logActivity error:', err)
      }
    })()
  }, [uid])

  return { logActivity }
}
