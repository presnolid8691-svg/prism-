'use client'

import { useState, useEffect, useRef } from 'react'
import {
  collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, updateDoc, doc, increment
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Heart, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Timestamp } from 'firebase/firestore'

interface Comment {
  id: string
  authorId: string
  authorName: string
  authorPhoto: string | null
  content: string
  likeCount: number
  likedBy: string[]
  createdAt: Timestamp
}

interface PostCommentsProps {
  postId: string
  open: boolean
  onClose: () => void
}

export function PostComments({ postId, open, onClose }: PostCommentsProps) {
  const { uid, user } = useAuthStore()
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const q = query(
      collection(db, 'feed', postId, 'comments'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment)))
    })
    return unsub
  }, [postId, open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const handleSend = async () => {
    if (!uid || !user || !text.trim()) return
    setSending(true)
    const commentData = {
      authorId: uid,
      authorName: user.displayName,
      authorPhoto: user.photoURL ?? null,
      content: text.trim(),
      likeCount: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
    }
    setText('')
    try {
      await addDoc(collection(db, 'feed', postId, 'comments'), commentData)
      await updateDoc(doc(db, 'feed', postId), { commentCount: increment(1) })
    } catch { /* silent */ }
    setSending(false)
  }

  const toggleCommentLike = async (comment: Comment) => {
    if (!uid) return
    const liked = comment.likedBy.includes(uid)
    const ref = doc(db, 'feed', postId, 'comments', comment.id)
    await updateDoc(ref, {
      likeCount: increment(liked ? -1 : 1),
      likedBy: liked
        ? comment.likedBy.filter(id => id !== uid)
        : [...comment.likedBy, uid],
    })
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0 rounded-t-2xl md:side-right">
        <SheetHeader className="px-4 py-3 border-b border-zinc-100">
          <SheetTitle className="text-base font-semibold">Comments</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          {comments.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-zinc-400">
              No comments yet. Be the first!
            </div>
          ) : (
            <div className="py-4 space-y-4">
              {comments.map(comment => {
                const isLiked = uid ? comment.likedBy.includes(uid) : false
                const createdAt = comment.createdAt?.toDate ? comment.createdAt.toDate() : new Date()
                return (
                  <div key={comment.id} className="flex gap-3 items-start">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={comment.authorPhoto ?? undefined} />
                      <AvatarFallback className="text-xs bg-zinc-100 text-zinc-600">
                        {comment.authorName?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-zinc-900">{comment.authorName}</span>
                        <span className="text-xs text-zinc-400">{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm text-zinc-700 mt-0.5 leading-relaxed">{comment.content}</p>
                    </div>
                    <button
                      onClick={() => toggleCommentLike(comment)}
                      className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-1"
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-zinc-400'}`} />
                      {comment.likeCount > 0 && (
                        <span className="text-xs text-zinc-400">{comment.likeCount}</span>
                      )}
                    </button>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-100">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={user?.photoURL ?? undefined} />
            <AvatarFallback className="text-xs bg-blue-50 text-blue-700">
              {user?.displayName?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Add a comment…"
            className="flex-1 border-zinc-200 focus-visible:ring-blue-500 text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 w-9 h-9"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
