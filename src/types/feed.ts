import { Timestamp } from 'firebase/firestore'

export interface PostMediaMeta {
  mimeType: string
  width: number
  height: number
}

export interface FeedPost {
  id: string
  authorId: string
  caption: string
  mediaURLs: string[]
  mediaMeta: PostMediaMeta[]
  likeCount: number
  commentCount: number
  likedBy: string[]
  tags: string[]
  location: string | null
  createdAt: Timestamp
  editedAt: Timestamp | null
}

export interface PostComment {
  id: string
  authorId: string
  text: string
  replyTo: string | null
  reactions: Record<string, string[]>
  createdAt: Timestamp
}
