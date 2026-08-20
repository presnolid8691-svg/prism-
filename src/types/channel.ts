import { Timestamp } from 'firebase/firestore'

export interface Channel {
  id: string
  name: string
  description: string
  handle: string
  coverURL: string | null
  iconURL: string | null
  ownerId: string
  adminIds: string[]
  memberCount: number
  isPublic: boolean
  category: string
  pinnedMessageId: string | null
  createdAt: Timestamp
  lastPostAt: Timestamp
}

export interface ChannelMember {
  uid: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: Timestamp
  notifications: 'all' | 'mentions' | 'none'
}

export type ChannelCategory =
  | 'Tech'
  | 'Sports'
  | 'Music'
  | 'Gaming'
  | 'News'
  | 'Art'
  | 'Science'
  | 'Other'
