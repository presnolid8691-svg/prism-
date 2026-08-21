'use client'

import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, query, where, orderBy,
  doc, getDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StoryViewer } from '@/components/stories/StoryViewer'
import { StoryUploadModal } from '@/components/stories/StoryUploadModal'
import { Plus } from 'lucide-react'
import { Story } from '@/types/story'
import { User } from '@/types/user'
import { Timestamp } from 'firebase/firestore'
import { cn } from '@/lib/utils'

interface StoryGroup {
  userId: string
  user: User | null
  stories: Story[]
  hasUnseen: boolean
}

export function StoriesReel() {
  const { uid, user } = useAuthStore()
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([])
  const [ownStories, setOwnStories] = useState<Story[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewerState, setViewerState] = useState<{ userId: string; index: number } | null>(null)
  const [userCache, setUserCache] = useState<Record<string, User>>({})

  useEffect(() => {
    if (!uid) return
    const now = Timestamp.now()
    const q = query(
      collection(db, 'stories'),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'asc')
    )
    const unsub = onSnapshot(q, async snap => {
      const stories = snap.docs.map(d => ({ id: d.id, ...d.data() } as Story))
      const mine = stories.filter(s => s.authorId === uid)
      setOwnStories(mine)

      const others = stories.filter(s => s.authorId !== uid)
      const byUser: Record<string, Story[]> = {}
      others.forEach(s => {
        if (!byUser[s.authorId]) byUser[s.authorId] = []
        byUser[s.authorId].push(s)
      })

      const uniqueIds = Object.keys(byUser)
      const newCache = { ...userCache }
      const missing = uniqueIds.filter(id => !newCache[id])
      if (missing.length > 0) {
        await Promise.all(
          missing.map(async id => {
            const snap2 = await getDoc(doc(db, 'users', id))
            if (snap2.exists()) newCache[id] = { uid: snap2.id, ...snap2.data() } as User
          })
        )
        setUserCache(newCache)
      }

      const groups: StoryGroup[] = uniqueIds.map(userId => ({
        userId,
        user: newCache[userId] ?? null,
        stories: byUser[userId],
        hasUnseen: byUser[userId].some(s => !s.viewerIds.includes(uid)),
      }))
      setStoryGroups(groups)
    })
    return unsub
  }, [uid])

  const openStory = (userId: string, index = 0) => {
    setViewerState({ userId, index })
  }

  return (
    <>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Own story */}
          <button
            onClick={() => ownStories.length > 0 ? openStory(uid!, 0) : setUploadOpen(true)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div className="relative">
              <div className={cn(
                'w-14 h-14 rounded-full p-0.5',
                ownStories.length > 0 ? 'bg-blue-600' : 'bg-zinc-200'
              )}>
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={user?.photoURL ?? undefined} />
                    <AvatarFallback className="text-xs bg-blue-50 text-blue-700 font-semibold">
                      {user?.displayName?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              {ownStories.length === 0 && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                  <Plus className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            <span className="text-xs text-zinc-600 font-medium">
              {ownStories.length > 0 ? 'Your story' : 'Add story'}
            </span>
          </button>

          {/* Other users' stories */}
          {storyGroups.map(group => (
            <button
              key={group.userId}
              onClick={() => openStory(group.userId, 0)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <div className={cn(
                'w-14 h-14 rounded-full p-0.5',
                group.hasUnseen ? 'bg-blue-600' : 'bg-zinc-300'
              )}>
                <div className="w-full h-full rounded-full bg-white p-0.5">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={group.user?.photoURL ?? undefined} />
                    <AvatarFallback className="text-xs bg-zinc-100 text-zinc-600 font-semibold">
                      {group.user?.displayName?.slice(0, 2).toUpperCase() ?? '??'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-xs text-zinc-600 font-medium max-w-[56px] truncate">
                {group.user?.username ?? '…'}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>

      {viewerState && (
        <StoryViewer
          userId={viewerState.userId}
          storyIndex={viewerState.index}
          onClose={() => setViewerState(null)}
        />
      )}

      <StoryUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  )
}

