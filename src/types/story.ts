import { Timestamp } from 'firebase/firestore'

export interface QALink {
  token: string
  question: string
  isOpen: boolean
}

export interface Story {
  id: string
  authorId: string
  mediaURL: string
  mediaType: 'image' | 'video'
  thumbnailURL: string | null
  caption: string | null
  duration: number
  viewerIds: string[]
  viewerCount: number
  likeCount: number
  expiresAt: Timestamp
  createdAt: Timestamp
  qaLink: QALink | null
}

export interface StoryView {
  uid: string
  viewedAt: Timestamp
}
