'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { StoriesReel } from '@/components/stories/StoriesReel'
import { PostCard } from '@/components/feed/PostCard'
import { CreatePostModal } from '@/components/feed/CreatePostModal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'
import { FeedPost } from '@/types/feed'
import { User } from '@/types/user'

export function FeedPage() {
  const { uid } = useAuthStore()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [authors, setAuthors] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(db, 'feed'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, async snap => {
      const fetchedPosts = snap.docs.map(d => ({ id: d.id, ...d.data() } as FeedPost))
      setPosts(fetchedPosts)

      // Fetch unique author profiles
      const uniqueAuthorIds = [...new Set(fetchedPosts.map(p => p.authorId))]
      const missing = uniqueAuthorIds.filter(id => !authors[id])
      if (missing.length > 0) {
        const authorSnaps = await Promise.all(
          missing.map(id =>
            new Promise<User | null>(resolve => {
              const unsub2 = onSnapshot(
                collection(db, 'users'),
                snap2 => {
                  const userDoc = snap2.docs.find(d => d.id === id)
                  unsub2()
                  resolve(userDoc ? ({ uid: userDoc.id, ...userDoc.data() } as User) : null)
                }
              )
            })
          )
        )
        const newAuthors: Record<string, User> = {}
        authorSnaps.forEach(u => { if (u) newAuthors[u.uid] = u })
        setAuthors(prev => ({ ...prev, ...newAuthors }))
      }
      setLoading(false)
    })
    return unsub
  }, [uid])

  return (
    <div className="relative min-h-full bg-zinc-50">
      {/* Stories */}
      <div className="sticky top-0 z-10 bg-white border-b border-zinc-200">
        <StoriesReel />
      </div>

      {/* Feed */}
      <div className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>
                <Skeleton className="w-full aspect-square" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="text-base font-semibold text-zinc-700">No posts yet</p>
            <p className="text-sm text-zinc-400 mt-1">Follow users to see their posts, or create your own.</p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Create a post
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => {
              const author = authors[post.authorId]
              if (!author) return null
              return <PostCard key={post.id} post={post} author={author} />
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors z-20"
        aria-label="Create post"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
