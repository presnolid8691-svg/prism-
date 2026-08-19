'use client'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

export function usePresence() {
  const { uid } = useAuthStore()

  useEffect(() => {
    if (!uid) return
    const userRef = doc(db, 'users', uid)
    
    const setOnline = async () => {
      try { await updateDoc(userRef, { presence: 'online', lastSeen: serverTimestamp() }) } catch (e) {}
    }
    const setOffline = async () => {
      try { await updateDoc(userRef, { presence: 'offline', lastSeen: serverTimestamp() }) } catch (e) {}
    }

    setOnline()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') setOffline()
      else setOnline()
    }
    
    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', setOffline)

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', setOffline)
      setOffline()
    }
  }, [uid])
}