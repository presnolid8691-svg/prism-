'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { Channel } from '@/types/channel'
import { Message } from '@/types/message'

interface UseChannelReturn {
  channel: Channel | null
  posts: Message[]
  isMember: boolean
  isAdmin: boolean
  isOwner: boolean
  isLoading: boolean
}

export function useChannel(channelId: string): UseChannelReturn {
  const [channel, setChannel] = useState<Channel | null>(null)
  const [posts, setPosts] = useState<Message[]>([])
  const [isMember, setIsMember] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const uid = useAuthStore((s) => s.uid)

  useEffect(() => {
    if (!channelId || !uid) return

    // Subscribe to channel document
    const channelRef = doc(db, 'channels', channelId)
    const unsubscribeChannel = onSnapshot(
      channelRef,
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Channel
          setChannel(data)
          setIsOwner(data.ownerId === uid)
          setIsAdmin(data.adminIds?.includes(uid) || data.ownerId === uid)
        } else {
          setChannel(null)
        }
        setIsLoading(false)
      },
      (err) => {
        console.error('[useChannel] channel doc error:', err)
        setIsLoading(false)
      }
    )

    // Subscribe to channel posts ordered by sentAt desc
    const postsRef = collection(db, 'channels', channelId, 'posts')
    const postsQuery = query(postsRef, orderBy('sentAt', 'desc'))
    const unsubscribePosts = onSnapshot(
      postsQuery,
      (snap) => {
        const fetched = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Message[]
        setPosts(fetched)
      },
      (err) => console.error('[useChannel] posts error:', err)
    )

    // Subscribe to membership doc
    const memberRef = doc(db, 'channels', channelId, 'members', uid)
    const unsubscribeMember = onSnapshot(
      memberRef,
      (snap) => {
        setIsMember(snap.exists())
      },
      (err) => console.error('[useChannel] member error:', err)
    )

    return () => {
      unsubscribeChannel()
      unsubscribePosts()
      unsubscribeMember()
    }
  }, [channelId, uid])

  return {
    channel,
    posts,
    isMember,
    isAdmin,
    isOwner,
    isLoading,
  }
}
