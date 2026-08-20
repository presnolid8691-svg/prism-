'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Radio,
  Plus,
  Search,
  Users,
  Check,
  Compass,
  Sparkles,
  Shield,
  Layers,
  X,
  ExternalLink,
  ChevronRight,
  UserCheck,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { db } from '@/lib/firebase/config'
import {
  collection,
  query,
  getDocs,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  increment,
  updateDoc,
} from 'firebase/firestore'
import { Channel, ChannelCategory } from '@/types/channel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils/cn'

const CATEGORIES: ChannelCategory[] = [
  'Tech',
  'Gaming',
  'News',
  'Science',
  'Art',
  'Music',
  'Sports',
  'Other',
]

export function ChannelBrowser() {
  const router = useRouter()
  const { user, uid } = useAuthStore()

  const [channels, setChannels] = useState<Channel[]>([])
  const [joinedChannelIds, setJoinedChannelIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [activeTab, setActiveTab] = useState<'discover' | 'joined' | 'created'>('discover')

  // Create Channel Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newHandle, setNewHandle] = useState('')
  const [newCategory, setNewCategory] = useState<ChannelCategory>('Tech')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)

  // Subscribe to all channels
  useEffect(() => {
    const q = query(collection(db, 'channels'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Channel[] = []
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Channel)
        })
        // Sort by memberCount or createdAt
        list.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
        setChannels(list)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching channels:', err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Check joined channels for current user
  useEffect(() => {
    if (!uid || channels.length === 0) return

    const checkMemberships = async () => {
      const joined = new Set<string>()
      for (const ch of channels) {
        if (ch.ownerId === uid) {
          joined.add(ch.id)
          continue
        }
        try {
          const mRef = doc(db, 'channels', ch.id, 'members', uid)
          const mSnap = await getDocs(query(collection(db, 'channels', ch.id, 'members')))
          mSnap.forEach((mDoc) => {
            if (mDoc.id === uid) joined.add(ch.id)
          })
        } catch {
          // ignore
        }
      }
      setJoinedChannelIds(joined)
    }

    checkMemberships()
  }, [uid, channels])

  // Handle Join / Leave channel
  const handleToggleJoin = async (channelId: string, isCurrentlyJoined: boolean, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!uid) return

    const channelRef = doc(db, 'channels', channelId)
    const memberRef = doc(db, 'channels', channelId, 'members', uid)

    try {
      if (isCurrentlyJoined) {
        await deleteDoc(memberRef)
        await updateDoc(channelRef, {
          memberCount: increment(-1),
        })
        setJoinedChannelIds((prev) => {
          const next = new Set(prev)
          next.delete(channelId)
          return next
        })
      } else {
        await setDoc(memberRef, {
          uid,
          role: 'member',
          joinedAt: serverTimestamp(),
          notifications: 'all',
        })
        await updateDoc(channelRef, {
          memberCount: increment(1),
        })
        setJoinedChannelIds((prev) => new Set(prev).add(channelId))
      }
    } catch (err) {
      console.error('Error joining/leaving channel:', err)
    }
  }

  // Handle Create Channel
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uid || !newName.trim() || !newHandle.trim() || creating) return

    setCreating(true)
    try {
      const cleanHandle = newHandle.trim().replace(/^@/, '').toLowerCase()
      const newChannelRef = await addDoc(collection(db, 'channels'), {
        name: newName.trim(),
        handle: cleanHandle,
        description: newDescription.trim(),
        category: newCategory,
        coverURL: null,
        iconURL: null,
        ownerId: uid,
        adminIds: [uid],
        memberCount: 1,
        isPublic: true,
        pinnedMessageId: null,
        createdAt: serverTimestamp(),
        lastPostAt: serverTimestamp(),
      })

      // Add owner as first member
      await setDoc(doc(db, 'channels', newChannelRef.id, 'members', uid), {
        uid,
        role: 'owner',
        joinedAt: serverTimestamp(),
        notifications: 'all',
      })

      setJoinedChannelIds((prev) => new Set(prev).add(newChannelRef.id))
      setCreateModalOpen(false)
      setNewName('')
      setNewHandle('')
      setNewDescription('')
      router.push(`/channels/${newChannelRef.id}`)
    } catch (err) {
      console.error('Error creating channel:', err)
    } finally {
      setCreating(false)
    }
  }

  // Filter channels based on tab, category, search
  const filteredChannels = channels.filter((ch) => {
    if (activeTab === 'joined' && !joinedChannelIds.has(ch.id)) return false
    if (activeTab === 'created' && ch.ownerId !== uid) return false

    if (selectedCategory !== 'All' && ch.category !== selectedCategory) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      return (
        ch.name?.toLowerCase().includes(q) ||
        ch.handle?.toLowerCase().includes(q) ||
        ch.description?.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Channel Browser
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Discover public broadcasting channels & communities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create Channel
            </Button>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels by name, @handle, or topic..."
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

          {/* Tab Filter */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg shrink-0">
            <button
              onClick={() => setActiveTab('discover')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                activeTab === 'discover'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              )}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                activeTab === 'joined'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              )}
            >
              Joined ({joinedChannelIds.size})
            </button>
            <button
              onClick={() => setActiveTab('created')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                activeTab === 'created'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              )}
            >
              My Channels
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('All')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-full transition-colors shrink-0',
              selectedCategory === 'All'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            )}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-full transition-colors shrink-0',
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Channels Grid / List */}
      <ScrollArea className="flex-1 p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="py-20 text-center text-sm text-zinc-500">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading channels...
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center shadow-sm">
              <Radio className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                {searchQuery ? 'No matching channels' : 'No channels found'}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto mb-4">
                {searchQuery
                  ? 'Try searching for different keywords or categories.'
                  : 'Be the first to create an exciting broadcast channel for your community!'}
              </p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create New Channel
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChannels.map((ch) => {
                const isJoined = joinedChannelIds.has(ch.id)
                const isOwner = ch.ownerId === uid

                return (
                  <div
                    key={ch.id}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                          {ch.iconURL ? (
                            <img src={ch.iconURL} alt={ch.name} className="w-full h-full object-cover" />
                          ) : (
                            ch.name?.charAt(0) || '#'
                          )}
                        </div>

                        <Badge variant="secondary" className="text-[10px]">
                          {ch.category || 'General'}
                        </Badge>
                      </div>

                      {/* Name & Handle */}
                      <Link href={`/channels/${ch.id}`}>
                        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors truncate">
                          {ch.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-zinc-400 font-medium truncate mb-2">
                        @{ch.handle || ch.id}
                      </p>

                      {/* Description */}
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-4 min-h-[2rem]">
                        {ch.description || 'Welcome to the channel! Join to receive public announcements and updates.'}
                      </p>
                    </div>

                    {/* Footer Info & Action */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        {ch.memberCount || 1} {ch.memberCount === 1 ? 'member' : 'members'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Link href={`/channels/${ch.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-blue-600 px-2 h-8"
                          >
                            Open
                          </Button>
                        </Link>

                        {!isOwner && (
                          <Button
                            variant={isJoined ? 'outline' : 'default'}
                            size="sm"
                            onClick={(e) => handleToggleJoin(ch.id, isJoined, e)}
                            className={cn(
                              'text-xs h-8 px-3',
                              isJoined
                                ? 'text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            )}
                          >
                            {isJoined ? 'Joined' : 'Join'}
                          </Button>
                        )}

                        {isOwner && (
                          <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200">
                            Owner
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Channel Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Create New Channel
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Channel Name
                </label>
                <Input
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value)
                    if (!newHandle) {
                      setNewHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                    }
                  }}
                  placeholder="e.g. Prism Developers"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Channel Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">@</span>
                  <Input
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="prism_devs"
                    className="pl-7 font-mono text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ChannelCategory)}
                  className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-600 text-zinc-900 dark:text-zinc-100"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Tell people what your channel broadcasts..."
                  rows={3}
                  className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-600 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!newName.trim() || !newHandle.trim() || creating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {creating ? 'Creating...' : 'Create Channel'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
