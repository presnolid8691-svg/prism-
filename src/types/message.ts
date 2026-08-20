import { Timestamp } from 'firebase/firestore'

export interface MediaMeta {
  mimeType: string
  sizeBytes: number
  durationSecs: number | null
  waveformData: number[] | null
  thumbnailURL: string | null
}

export interface LinkPreview {
  url: string
  title: string
  description: string
  imageURL: string
  siteName: string
}

export interface ReplyTo {
  messageId: string
  senderName: string
  contentPreview: string
}

export interface SelfDestruct {
  enabled: boolean
  durationSecs: 5 | 10 | 30 | null
  viewedAt: Timestamp | null
  expiresAt: Timestamp | null
}

export type MessageType = 'text' | 'image' | 'voice' | 'gif' | 'file' | 'video'
export type MessageStatus = 'sending' | 'sent' | 'failed'

export interface Message {
  id: string
  senderId: string
  type: MessageType
  content: string
  isEncrypted: boolean
  mediaURL: string | null
  mediaMeta: MediaMeta | null
  gifURL: string | null
  linkPreview: LinkPreview | null
  replyTo: ReplyTo | null
  threadId: string | null
  reactions: Record<string, string[]>
  readBy: string[]
  deliveredTo: string[]
  selfDestruct: SelfDestruct | null
  isPinned: boolean
  sentAt: Timestamp
  editedAt: Timestamp | null
  deletedAt: Timestamp | null
  // Optimistic UI fields
  localId?: string
  status?: MessageStatus
}
