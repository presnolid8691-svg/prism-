import {
  collection,
  doc,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore'
import { db } from './config'

// ─── Users ──────────────────────────────────────────────────────────────────

export const usersRef = (): CollectionReference => collection(db, 'users')

export const userRef = (uid: string): DocumentReference =>
  doc(db, 'users', uid)

// ─── Notifications ───────────────────────────────────────────────────────────

export const notificationsRef = (uid: string): CollectionReference =>
  collection(db, 'users', uid, 'notifications')

export const activityLogRef = (uid: string): CollectionReference =>
  collection(db, 'users', uid, 'activityLog')

export const savedMessagesRef = (uid: string): CollectionReference =>
  collection(db, 'users', uid, 'savedMessages')

// ─── Follows ─────────────────────────────────────────────────────────────────

export const followsRef = (): CollectionReference => collection(db, 'follows')

// ─── Chats ───────────────────────────────────────────────────────────────────

export const chatsRef = (): CollectionReference => collection(db, 'chats')

export const chatRef = (chatId: string): DocumentReference =>
  doc(db, 'chats', chatId)

export const messagesRef = (chatId: string): CollectionReference =>
  collection(db, 'chats', chatId, 'messages')

export const messageRef = (
  chatId: string,
  msgId: string,
): DocumentReference => doc(db, 'chats', chatId, 'messages', msgId)

export const threadMessagesRef = (
  chatId: string,
  threadId: string,
): CollectionReference =>
  collection(db, 'chats', chatId, 'threads', threadId, 'messages')

// ─── Channels ─────────────────────────────────────────────────────────────────

export const channelsRef = (): CollectionReference => collection(db, 'channels')

export const channelRef = (id: string): DocumentReference =>
  doc(db, 'channels', id)

export const channelPostsRef = (id: string): CollectionReference =>
  collection(db, 'channels', id, 'posts')

export const channelMembersRef = (id: string): CollectionReference =>
  collection(db, 'channels', id, 'members')

// ─── Stories ──────────────────────────────────────────────────────────────────

export const storiesRef = (): CollectionReference => collection(db, 'stories')

export const storyRef = (id: string): DocumentReference =>
  doc(db, 'stories', id)

export const storyViewsRef = (id: string): CollectionReference =>
  collection(db, 'stories', id, 'views')

// ─── Feed ─────────────────────────────────────────────────────────────────────

export const feedRef = (): CollectionReference => collection(db, 'feed')

export const feedPostRef = (id: string): DocumentReference =>
  doc(db, 'feed', id)

export const feedCommentsRef = (postId: string): CollectionReference =>
  collection(db, 'feed', postId, 'comments')

// ─── WebRTC ───────────────────────────────────────────────────────────────────

export const webrtcSessionsRef = (): CollectionReference =>
  collection(db, 'webrtcSessions')

export const webrtcSessionRef = (id: string): DocumentReference =>
  doc(db, 'webrtcSessions', id)

export const callerCandidatesRef = (sessionId: string): CollectionReference =>
  collection(db, 'webrtcSessions', sessionId, 'callerCandidates')

export const calleeCandidatesRef = (sessionId: string): CollectionReference =>
  collection(db, 'webrtcSessions', sessionId, 'calleeCandidates')

// ─── Q&A Links ────────────────────────────────────────────────────────────────

export const qaLinksRef = (): CollectionReference => collection(db, 'qaLinks')

export const qaLinkRef = (token: string): DocumentReference =>
  doc(db, 'qaLinks', token)

export const qaSubmissionsRef = (token: string): CollectionReference =>
  collection(db, 'qaLinks', token, 'submissions')

// ─── Broadcast Lists ─────────────────────────────────────────────────────────

export const broadcastListsRef = (): CollectionReference =>
  collection(db, 'broadcastLists')

export const broadcastListRef = (id: string): DocumentReference =>
  doc(db, 'broadcastLists', id)

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns a deterministic chat ID for a DM between two users.
 * UIDs are sorted alphabetically then joined with '_' to ensure
 * both parties always reference the same document regardless of
 * who initiated the conversation.
 */
export const getChatId = (uid1: string, uid2: string): string =>
  [uid1, uid2].sort().join('_')
