import { create } from 'zustand'

interface NotificationState {
  unreadCounts: Record<string, number>
  totalUnread: number
  fcmToken: string | null

  setUnreadCount: (id: string, count: number) => void
  incrementUnread: (id: string) => void
  clearUnread: (id: string) => void
  updateTotalUnread: () => void
  setFcmToken: (token: string | null) => void
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  unreadCounts: {},
  totalUnread: 0,
  fcmToken: null,

  setUnreadCount: (id, count) => {
    set((state) => {
      const updated = { ...state.unreadCounts, [id]: count }
      const total = Object.values(updated).reduce((acc, v) => acc + v, 0)
      return { unreadCounts: updated, totalUnread: total }
    })
  },

  incrementUnread: (id) => {
    set((state) => {
      const current = state.unreadCounts[id] ?? 0
      const updated = { ...state.unreadCounts, [id]: current + 1 }
      const total = Object.values(updated).reduce((acc, v) => acc + v, 0)
      return { unreadCounts: updated, totalUnread: total }
    })
  },

  clearUnread: (id) => {
    set((state) => {
      const updated = { ...state.unreadCounts }
      delete updated[id]
      const total = Object.values(updated).reduce((acc, v) => acc + v, 0)
      return { unreadCounts: updated, totalUnread: total }
    })
  },

  updateTotalUnread: () => {
    set((state) => ({
      totalUnread: Object.values(state.unreadCounts).reduce((acc, v) => acc + v, 0),
    }))
  },

  setFcmToken: (fcmToken) => set({ fcmToken }),
}))
