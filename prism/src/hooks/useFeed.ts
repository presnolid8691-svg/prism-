'use client'

import { useEffect, useRef, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { FeedPost } from '@/types/feed'

const PAGE_SIZE = 20

interface UseFeedReturn {
  posts: FeedPost[]
  isLoading: boolean
  loadMore: () => void
  hasMore: boolean
}

export function useFeed(): UseFeedReturn {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [pageCount, setPageCount] = useState(1)
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    setIsLoading(true)

    // Unsubscribe from previous listener before setting up new one
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    const feedRef = collection(db, 'feed')
    const q = query(
      feedRef,
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE * pageCount)
    )

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const fetched = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as FeedPost[]

        // Track last doc for pagination cursor
        lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null

        setHasMore(snap.docs.length === PAGE_SIZE * pageCount)
        setPosts(fetched)
        setIsLoading(false)
      },
      (err) => {
        console.error('[useFeed] error:', err)
        setIsLoading(false)
      }
    )

    unsubscribeRef.current = unsubscribe

    return () => {
      unsubscribe()
    }
  }, [pageCount])

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPageCount((prev) => prev + 1)
    }
  }

  return {
    posts,
    isLoading,
    loadMore,
    hasMore,
  }
}
