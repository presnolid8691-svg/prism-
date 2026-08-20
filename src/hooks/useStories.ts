'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Story } from '@/types/story'

interface UseStoriesReturn {
  stories: Story[]
  storiesByUser: Record<string, Story[]>
  isLoading: boolean
}

export function useStories(): UseStoriesReturn {
  const [stories, setStories] = useState<Story[]>([])
  const [storiesByUser, setStoriesByUser] = useState<Record<string, Story[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const now = Timestamp.now()
    const storiesRef = collection(db, 'stories')
    const q = query(
      storiesRef,
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'asc'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const fetched = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Story[]

        // Group by authorId for reel display
        const grouped: Record<string, Story[]> = {}
        fetched.forEach((story) => {
          if (!grouped[story.authorId]) {
            grouped[story.authorId] = []
          }
          grouped[story.authorId].push(story)
        })

        // Sort each user's stories by createdAt desc (newest first in reel)
        Object.keys(grouped).forEach((authorId) => {
          grouped[authorId].sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() ?? 0
            const bTime = b.createdAt?.toMillis?.() ?? 0
            return bTime - aTime
          })
        })

        setStories(fetched)
        setStoriesByUser(grouped)
        setIsLoading(false)
      },
      (err) => {
        console.error('[useStories] error:', err)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return { stories, storiesByUser, isLoading }
}
