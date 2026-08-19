'use client'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { User } from '@/types/user'

export function useAuth() {
  const { user, uid, isLoading, setUser, setLoading, reset } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (userDoc.exists()) {
            setUser(userDoc.data() as User)
          } else {
            // Document creation should be handled in register logic, but sync here just in case
            reset()
          }
        } catch (e) {
          console.error(e)
          reset()
        }
      } else {
        reset()
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [setUser, setLoading, reset])

  return { user, uid, isLoading, isAuthenticated: !!user }
}