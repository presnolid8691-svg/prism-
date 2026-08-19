import { create } from 'zustand'
import { Message } from '@/types/message'

interface ChatState {
  selectedChatId: string | null
  optimisticMessages: Record<string, Message[]>
  replyingTo: Message | null
  threadMessageId: string | null

  setSelectedChatId: (chatId: string | null) => void

  addOptimisticMessage: (chatId: string, msg: Message) => void
  confirmOptimisticMessage: (chatId: string, localId: string, realMessage: Message) => void
  failOptimisticMessage: (chatId: string, localId: string) => void
  clearOptimisticMessages: (chatId: string) => void

  setReplyingTo: (message: Message | null) => void
  clearReplyingTo: () => void

  setThreadMessageId: (messageId: string | null) => void
}

export const useChatStore = create<ChatState>()((set) => ({
  selectedChatId: null,
  optimisticMessages: {},
  replyingTo: null,
  threadMessageId: null,

  setSelectedChatId: (chatId) => set({ selectedChatId: chatId }),

  addOptimisticMessage: (chatId, msg) =>
    set((state) => ({
      optimisticMessages: {
        ...state.optimisticMessages,
        [chatId]: [...(state.optimisticMessages[chatId] ?? []), msg],
      },
    })),

  confirmOptimisticMessage: (chatId, localId, realMessage) =>
    set((state) => ({
      optimisticMessages: {
        ...state.optimisticMessages,
        [chatId]: (state.optimisticMessages[chatId] ?? []).map((m) =>
          m.localId === localId ? { ...realMessage, localId, status: 'sent' as const } : m
        ),
      },
    })),

  failOptimisticMessage: (chatId, localId) =>
    set((state) => ({
      optimisticMessages: {
        ...state.optimisticMessages,
        [chatId]: (state.optimisticMessages[chatId] ?? []).map((m) =>
          m.localId === localId ? { ...m, status: 'failed' as const } : m
        ),
      },
    })),

  clearOptimisticMessages: (chatId) =>
    set((state) => {
      const updated = { ...state.optimisticMessages }
      delete updated[chatId]
      return { optimisticMessages: updated }
    }),

  setReplyingTo: (message) => set({ replyingTo: message }),
  clearReplyingTo: () => set({ replyingTo: null }),

  setThreadMessageId: (messageId) => set({ threadMessageId: messageId }),
}))
