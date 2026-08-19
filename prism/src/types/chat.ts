import { Timestamp } from 'firebase/firestore'
import { MessageType } from './message'

export interface LastMessage {
  text: string
  senderId: string
  sentAt: Timestamp
  type: MessageType
}

export interface Chat {
  id: string
  participants: string[]
  createdAt: Timestamp
  lastMessage: LastMessage | null
  pinnedMessageId: string | null
  isSecretChat: boolean
  secretChatKeys: Record<string, string> | null
  theme: string | null
  wallpaperURL: string | null
  unreadCount: Record<string, number>
  typing: Record<string, boolean>
}
