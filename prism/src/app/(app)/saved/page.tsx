'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bookmark,
  Search,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Send,
  Calendar,
  Filter,
  FileText,
  Link2,
  Sparkles,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { db } from '@/lib/firebase/config'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { SavedMessage } from '@/types/user'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatMessageTime, formatDateSeparator } from '@/lib/utils/formatTime'
import { cn } from '@/lib/utils/cn'

export default function SavedPage() {
  const { user, uid } = useAuthStore()
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'text' | 'links'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Note creation input
  const [quickNote, setQuickNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // Subscribe to user's saved messages collection in Firestore
  useEffect(() => {
    if (!uid) return

    const q = query(
      collection(db, 'users', uid, 'savedMessages'),
      orderBy('savedAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as SavedMessage[]
        setSavedMessages(items)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching saved messages:', err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [uid])

  // Copy message text to clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Delete/unsave a message
  const handleDelete = async (id: string) => {
    if (!uid) return
    try {
      await deleteDoc(doc(db, 'users', uid, 'savedMessages', id))
    } catch (err) {
      console.error('Error deleting saved message:', err)
    }
  }

  // Add a new quick personal note directly to saved messages
  const handleAddQuickNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uid || !quickNote.trim() || savingNote) return

    setSavingNote(true)
    try {
      await addDoc(collection(db, 'users', uid, 'savedMessages'), {
        content: quickNote.trim(),
        senderName: user?.displayName || 'You',
        originalChatId: 'self',
        originalMessageId: 'self-note',
        savedAt: serverTimestamp(),
      })
      setQuickNote('')
    } catch (err) {
      console.error('Error adding personal note:', err)
    } finally {
      setSavingNote(false)
    }
  }

  // Filter messages based on search query and type filter
  const filteredMessages = savedMessages.filter((msg) => {
    const contentMatch = msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
    const senderMatch = msg.senderName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSearch = !searchQuery.trim() || contentMatch || senderMatch

    if (!matchesSearch) return false

    if (selectedFilter === 'links') {
      return /https?:\/\/[^\s]+/.test(msg.content)
    }
    if (selectedFilter === 'text') {
      return !/https?:\/\/[^\s]+/.test(msg.content)
    }
    return true
  })

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Saved Messages
                </h1>
                <Badge variant="secondary" className="text-xs">
                  {savedMessages.length} {savedMessages.length === 1 ? 'item' : 'items'}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Your personal cloud storage, bookmarks, and quick notes
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setSelectedFilter('all')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                selectedFilter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              All Items
            </button>
            <button
              onClick={() => setSelectedFilter('text')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1',
                selectedFilter === 'text'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              <FileText className="w-3 h-3" />
              Notes
            </button>
            <button
              onClick={() => setSelectedFilter('links')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1',
                selectedFilter === 'links'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              <Link2 className="w-3 h-3" />
              Links
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within saved messages and notes..."
            className="pl-9 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col max-w-4xl mx-auto w-full">
        {/* Quick Note Input Bar */}
        <form onSubmit={handleAddQuickNote} className="mb-4">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
            <Sparkles className="w-4 h-4 text-blue-600 ml-2 shrink-0" />
            <input
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="Type a personal note, save a link or code snippet..."
              className="flex-1 bg-transparent border-0 text-sm px-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!quickNote.trim() || savingNote}
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Save Note
            </Button>
          </div>
        </form>

        {/* Saved Messages List */}
        <ScrollArea className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4">
          {loading ? (
            <div className="py-16 text-center text-sm text-zinc-500">
              Loading saved messages...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="py-20 text-center text-zinc-500 px-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200 mb-1">
                {searchQuery ? 'No matching saved messages' : 'No saved messages yet'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                {searchQuery
                  ? 'Try searching with different keywords.'
                  : 'You can bookmark important messages from any chat conversation by clicking the bookmark option, or jot down quick personal notes above.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((msg) => {
                const dateLabel = msg.savedAt ? formatDateSeparator(msg.savedAt) : ''
                const timeLabel = msg.savedAt ? formatMessageTime(msg.savedAt) : ''
                const hasUrl = /https?:\/\/[^\s]+/.test(msg.content)
                const isSelf = msg.originalChatId === 'self'

                return (
                  <div
                    key={msg.id}
                    className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group"
                  >
                    {/* Message Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {msg.senderName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                          {msg.senderName}
                        </span>
                        {isSelf && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                            Personal Note
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span>{dateLabel} {timeLabel}</span>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words pl-9">
                      {msg.content}
                    </div>

                    {/* Message Footer / Actions */}
                    <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 pl-9">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="h-8 px-2.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>

                      {!isSelf && msg.originalChatId && (
                        <Link href={`/chats/${msg.originalChatId}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Go to original chat"
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                            Jump to Chat
                          </Button>
                        </Link>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(msg.id)}
                        className="h-8 px-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete from saved"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
