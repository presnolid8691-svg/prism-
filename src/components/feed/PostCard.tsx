'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageCircle, Send, Bookmark, MoreHorizontal,
  ChevronLeft, ChevronRight, Heart
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { LikeButton } from '@/components/feed/LikeButton'
import { PostComments } from '@/components/feed/PostComments'
import { FeedPost } from '@/types/feed'
import { User } from '@/types/user'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

interface PostCardProps {
  post: FeedPost
  author: User
}

function highlightHashtags(text: string) {
  return text.split(/(#\w+)/g).map((part, i) =>
    part.startsWith('#') ? (
      <span key={i} className="text-blue-600 font-medium">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

export function PostCard({ post, author }: PostCardProps) {
  const { uid } = useAuthStore()
  const [mediaIndex, setMediaIndex] = useState(0)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [doubleTapHeart, setDoubleTapHeart] = useState(false)
  const [captionExpanded, setCaptionExpanded] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const lastTap = useRef(0)

  const handleDoubleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      setDoubleTapHeart(true)
      setTimeout(() => setDoubleTapHeart(false), 800)
    }
    lastTap.current = now
  }, [])

  const toggleBookmark = async () => {
    if (!uid) return
    setBookmarked(b => !b)
    try {
      const ref = doc(db, 'users', uid, 'savedMessages', post.id)
      if (!bookmarked) {
        await updateDoc(ref, { postId: post.id, savedAt: new Date() })
      }
    } catch { /* silent */ }
  }

  const hasMultipleMedia = post.mediaURLs.length > 1
  const authorInitials = author.displayName?.slice(0, 2).toUpperCase() ?? '??'
  const createdAt = post.createdAt?.toDate ? post.createdAt.toDate() : new Date()

  return (
    <article className="bg-white border border-zinc-200 rounded-xl overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={author.photoURL ?? undefined} />
            <AvatarFallback className="bg-blue-50 text-blue-700 text-sm font-semibold">
              {authorInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-zinc-900 leading-none">{author.displayName}</p>
            <p className="text-xs text-zinc-500 mt-0.5">@{author.username}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8 text-zinc-500">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Copy link</DropdownMenuItem>
            {uid === author.uid && <DropdownMenuItem className="text-red-500">Delete post</DropdownMenuItem>}
            {uid !== author.uid && <DropdownMenuItem className="text-red-500">Report</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Media */}
      {post.mediaURLs.length > 0 && (
        <div
          className="relative w-full aspect-square bg-zinc-100 cursor-pointer select-none"
          onClick={handleDoubleTap}
        >
          <Image
            src={post.mediaURLs[mediaIndex]}
            alt="Post media"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
          {/* Double-tap heart */}
          {doubleTapHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="w-20 h-20 fill-white text-white opacity-90 animate-ping" />
            </div>
          )}
          {/* Carousel nav */}
          {hasMultipleMedia && (
            <>
              {mediaIndex > 0 && (
                <button
                  onClick={e => { e.stopPropagation(); setMediaIndex(i => i - 1) }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {mediaIndex < post.mediaURLs.length - 1 && (
                <button
                  onClick={e => { e.stopPropagation(); setMediaIndex(i => i + 1) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {/* Dots */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                {post.mediaURLs.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-colors',
                      i === mediaIndex ? 'bg-white' : 'bg-white/50'
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <LikeButton postId={post.id} likedBy={post.likedBy} likeCount={post.likeCount} />
          <button
            onClick={() => setCommentsOpen(true)}
            className="flex items-center gap-1.5 text-zinc-700 hover:text-blue-600 transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="text-zinc-700 hover:text-blue-600 transition-colors">
            <Send className="w-6 h-6" />
          </button>
        </div>
        <button
          onClick={toggleBookmark}
          className={cn('transition-colors', bookmarked ? 'text-blue-600' : 'text-zinc-700 hover:text-blue-600')}
        >
          <Bookmark className={cn('w-6 h-6', bookmarked && 'fill-blue-600')} />
        </button>
      </div>

      {/* Likes */}
      {post.likeCount > 0 && (
        <p className="px-4 text-sm font-semibold text-zinc-900">
          {post.likeCount.toLocaleString()} {post.likeCount === 1 ? 'like' : 'likes'}
        </p>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 mt-1">
          <p className="text-sm text-zinc-800 leading-relaxed">
            <span className="font-semibold mr-1">{author.username}</span>
            {captionExpanded || post.caption.length <= 120
              ? highlightHashtags(post.caption)
              : (
                <>
                  {highlightHashtags(post.caption.slice(0, 120))}
                  <button
                    onClick={() => setCaptionExpanded(true)}
                    className="text-zinc-500 ml-1"
                  >
                    ...more
                  </button>
                </>
              )
            }
          </p>
        </div>
      )}

      {/* Comments preview */}
      {post.commentCount > 0 && (
        <button
          onClick={() => setCommentsOpen(true)}
          className="px-4 mt-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          View all {post.commentCount} comments
        </button>
      )}

      {/* Time */}
      <p className="px-4 mt-1 mb-3 text-xs text-zinc-400 uppercase tracking-wide">
        {formatDistanceToNow(createdAt, { addSuffix: true })}
      </p>

      {/* Comments sheet */}
      <PostComments postId={post.id} open={commentsOpen} onClose={() => setCommentsOpen(false)} />
    </article>
  )
}
