import { Timestamp } from 'firebase/firestore'

export interface UserSettings {
  theme: 'light' | 'dark'
  notificationsEnabled: boolean
  mutedChats: string[]
  fcmToken: string | null
}

export interface SessionDevice {
  deviceId: string
  deviceName: string
  lastActive: Timestamp
  userAgent: string
}

export interface User {
  uid: string
  displayName: string
  username: string
  email: string
  photoURL: string | null
  bio: string
  customStatus: string
  presence: 'online' | 'offline'
  lastSeen: Timestamp
  createdAt: Timestamp
  settings: UserSettings
  sessionDevices: SessionDevice[]
  followerCount: number
  followingCount: number
}

export interface Notification {
  id: string
  type: 'message' | 'reaction' | 'follow' | 'story_view' | 'mention' | 'qa_answer'
  fromUid: string
  entityId: string
  preview: string
  read: boolean
  createdAt: Timestamp
}

export interface ActivityLog {
  date: string
  actionCount: number
  lastUpdated: Timestamp
}

export interface SavedMessage {
  id: string
  originalChatId: string
  originalMessageId: string
  savedAt: Timestamp
  content: string
  senderName: string
}
