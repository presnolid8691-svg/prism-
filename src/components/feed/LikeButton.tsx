'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  postId: string
  likedBy: string[]
  likeCount: number
}

export function LikeButton({ postId, likedBy, likeCount }: LikeButtonProps) {
  const { uid } = useAuthStore()
  const isLiked = uid ? likedBy.includes(uid) : false
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null)
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null)
  const [animating, setAnimating] = useState(false)

  const currentLiked = optimisticLiked !== null ? optimisticLiked : isLiked
  const currentCount = optimisticCount !== null ? optimisticCount : likeCount

  const handleLike = async () => {
    if (!uid) return
    const newLiked = !currentLiked
    setOptimisticLiked(newLiked)
    setOptimisticCount(currentCount + (newLiked ? 1 : -1))
    if (newLiked) {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 400)
    }
    try {
      const postRef = doc(db, 'feed', postId)
      await updateDoc(postRef, {
        likedBy: newLiked ? arrayUnion(uid) : arrayRemove(uid),
        likeCount: increment(newLiked ? 1 : -1),
      })
    } catch {
      setOptimisticLiked(currentLiked)
      setOptimisticCount(currentCount)
    }
  }

  return (
    <button
      onClick={handleLike}
      className="flex items-center gap-1.5 group"
      aria-label={currentLiked ? 'Unlike' : 'Like'}
    >
      <Heart
        className={cn(
          'w-6 h-6 transition-transform',
          currentLiked ? 'fill-red-500 text-red-500' : 'text-zinc-700 group-hover:text-red-400',
          animating && 'scale-125'
        )}
      />
      <span className="text-sm font-medium text-zinc-700">
        {currentCount > 0 ? currentCount.toLocaleString() : ''}
      </span>
    </button>
  )
}
