'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Users,
  Radio,
  MessageSquare,
  Sparkles,
  ArrowRight,
  X,
  History,
  TrendingUp,
  Hash,
  User as UserIcon,
  CheckCircle2,
  Clock,
  Compass,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { db } from '@/lib/firebase/config'
import {
  collection,
  query,
  getDocs,
  limit,
  where,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { getChatId } from '@/lib/firebase/firestore'
import { User } from '@/types/user'
import { Channel } from '@/types/channel'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils/cn'

type SearchTab = 'all' | 'users' | 'channels' | 'messages'

const TRENDING_TOPICS = [
  'WebRTC',
  'Next.js 15',
  'Tailwind CSS',
  'AI Assistants',
  'React 19',
  'Decentralized Chat',
  'Design Systems',
]

const POPULAR_CATEGORIES = [
  { name: 'Tech & Engineering', count: '1.4k members', tag: 'Tech' },
  { name: 'Gaming Hub', count: '980 members', tag: 'Gaming' },
  { name: 'AI & Machine Learning', count: '2.1k members', tag: 'Science' },
  { name: 'Design & Creative', count: '750 members', tag: 'Art' },
  { name: 'Music & Audio', count: '620 members', tag: 'Music' },
]

export function SearchPage() {
  const router = useRouter()
  const { user, uid } = useAuthStore()
  const { setSelectedChatId } = useChatStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<SearchTab>('all')
  const [loading, setLoading] = useState(false)

  // Results
  const [userResults, setUserResults] = useState<User[]>([])
  const [channelResults, setChannelResults] = useState<Channel[]>([])

  // Recent searches saved in localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('prism_recent_searches')
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    } catch {
      // fallback
    }
  }, [])

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return
    const updated = [term.trim(), ...recentSearches.filter((s) => s.toLowerCase() !== term.trim().toLowerCase())].slice(0, 8)
    setRecentSearches(updated)
    try {
      localStorage.setItem('prism_recent_searches', JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = recentSearches.filter((s) => s !== term)
    setRecentSearches(updated)
    try {
      localStorage.setItem('prism_recent_searches', JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  const clearAllRecent = () => {
    setRecentSearches([])
    try {
      localStorage.removeItem('prism_recent_searches')
    } catch {
      // ignore
    }
  }

  // Search executor
  useEffect(() => {
    if (!searchQuery.trim()) {
      setUserResults([])
      setChannelResults([])
      setLoading(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      const q = searchQuery.toLowerCase().trim()

      try {
        // Search Users
        const usersSnap = await getDocs(query(collection(db, 'users'), limit(30)))
        const matchedUsers: User[] = []
        usersSnap.forEach((docSnap) => {
          const data = { uid: docSnap.id, ...docSnap.data() } as User
          if (
            docSnap.id !== uid &&
            (data.displayName?.toLowerCase().includes(q) ||
              data.username?.toLowerCase().includes(q) ||
              data.email?.toLowerCase().includes(q) ||
              data.bio?.toLowerCase().includes(q))
          ) {
            matchedUsers.push(data)
          }
        })
        setUserResults(matchedUsers)

        // Search Channels
        const channelsSnap = await getDocs(query(collection(db, 'channels'), limit(30)))
        const matchedChannels: Channel[] = []
        channelsSnap.forEach((docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() } as Channel
          if (
            data.name?.toLowerCase().includes(q) ||
            data.handle?.toLowerCase().includes(q) ||
            data.description?.toLowerCase().includes(q) ||
            data.category?.toLowerCase().includes(q)
          ) {
            matchedChannels.push(data)
          }
        })
        setChannelResults(matchedChannels)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, uid])

  const handleStartChatWithUser = async (targetUid: string) => {
    if (!uid) return
    const chatId = getChatId(uid, targetUid)
    saveRecentSearch(searchQuery)

    try {
      // Ensure chat doc exists
      await setDoc(
        doc(db, 'chats', chatId),
        {
          id: chatId,
          participants: [uid, targetUid],
          createdAt: serverTimestamp(),
        },
        { merge: true }
      )
      setSelectedChatId(chatId)
      router.push(`/chats/${chatId}`)
    } catch (err) {
      console.error('Error starting chat:', err)
      router.push(`/chats/${chatId}`)
    }
  }

  const totalResultsCount = userResults.length + channelResults.length

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      {/* Header Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-5">
        <div className="max-w-3xl mx-auto w-full">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            Global Search
          </h1>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  saveRecentSearch(searchQuery)
                }
              }}
              placeholder="Search people, @handles, channels, topics, or messages..."
              className="pl-11 pr-10 h-12 text-base bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          {searchQuery && (
            <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                )}
              >
                All ({totalResultsCount})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5',
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                )}
              >
                <Users className="w-3.5 h-3.5" />
                People ({userResults.length})
              </button>
              <button
                onClick={() => setActiveTab('channels')}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5',
                  activeTab === 'channels'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                )}
              >
                <Radio className="w-3.5 h-3.5" />
                Channels ({channelResults.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Results or Explore Area */}
      <ScrollArea className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          {!searchQuery ? (
            /* Discovery & Recent Searches View */
            <div className="space-y-6">
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      <History className="w-4 h-4 text-zinc-400" />
                      Recent Searches
                    </div>
                    <button
                      onClick={clearAllRecent}
                      className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => setSearchQuery(term)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs rounded-full transition-colors group"
                      >
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{term}</span>
                        <span
                          onClick={(e) => removeRecentSearch(term, e)}
                          className="hover:text-red-500 ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Topics */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Trending Topics
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => {
                        setSearchQuery(topic)
                        saveRecentSearch(topic)
                      }}
                      className="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5"
                    >
                      <Hash className="w-3 h-3 text-blue-500" />
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Discovery Channels */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    <Compass className="w-4 h-4 text-blue-600" />
                    Popular Categories
                  </div>
                  <Link
                    href="/channels"
                    className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Browse Channels
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {POPULAR_CATEGORIES.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => {
                        setSearchQuery(cat.tag)
                        saveRecentSearch(cat.tag)
                      }}
                      className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {cat.name}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">{cat.count}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {cat.tag}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : loading ? (
            /* Loading state */
            <div className="py-20 text-center text-sm text-zinc-500">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Searching Prism network...
            </div>
          ) : totalResultsCount === 0 ? (
            /* No results state */
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center shadow-sm">
              <Search className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                No results found for &ldquo;{searchQuery}&rdquo;
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Check your spelling, try searching for usernames starting with @, or explore popular topics.
              </p>
            </div>
          ) : (
            /* Active Results view */
            <div className="space-y-6">
              {/* Users Section */}
              {(activeTab === 'all' || activeTab === 'users') && userResults.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      People ({userResults.length})
                    </h3>
                  </div>

                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {userResults.map((u) => (
                      <div
                        key={u.uid}
                        className="p-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="w-10 h-10 border border-zinc-200 dark:border-zinc-700">
                            <AvatarImage src={u.photoURL || ''} />
                            <AvatarFallback className="font-semibold bg-zinc-100 dark:bg-zinc-800">
                              {u.displayName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                {u.displayName}
                              </p>
                              {u.presence === 'online' && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 truncate">
                              @{u.username || u.email?.split('@')[0]}
                            </p>
                            {u.bio && (
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate mt-0.5 max-w-md">
                                {u.bio}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Link href={`/profile/${u.uid}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-zinc-600 dark:text-zinc-400"
                            >
                              Profile
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            onClick={() => handleStartChatWithUser(u.uid)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Channels Section */}
              {(activeTab === 'all' || activeTab === 'channels') && channelResults.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-blue-600" />
                      Channels ({channelResults.length})
                    </h3>
                  </div>

                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {channelResults.map((ch) => (
                      <div
                        key={ch.id}
                        className="p-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-base shrink-0">
                            {ch.iconURL ? (
                              <img src={ch.iconURL} alt={ch.name} className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              ch.name?.charAt(0) || '#'
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                {ch.name}
                              </p>
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                {ch.category || 'General'}
                              </Badge>
                            </div>
                            <p className="text-xs text-zinc-400 truncate">
                              @{ch.handle || ch.id} • {ch.memberCount || 0} members
                            </p>
                            {ch.description && (
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate mt-0.5 max-w-md">
                                {ch.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <Link href={`/channels/${ch.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          >
                            View Channel
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
