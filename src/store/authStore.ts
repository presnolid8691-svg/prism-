import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types/user'

interface AuthState {
  user: User | null
  uid: string | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setUid: (uid: string | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      uid: null,
      isLoading: true,
      setUser: (user) => set({ user, uid: user?.uid ?? null }),
      setUid: (uid) => set({ uid }),
      setLoading: (isLoading) => set({ isLoading }),
      reset: () => set({ user: null, uid: null, isLoading: false }),
    }),
    { name: 'prism-auth', partialize: (s) => ({ uid: s.uid }) }
  )
)
