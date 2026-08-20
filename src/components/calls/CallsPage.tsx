'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Phone,
  Video,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  Search,
  UserPlus,
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Check,
  X,
  User as UserIcon,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useWebRTC } from '@/hooks/useWebRTC'
import { db } from '@/lib/firebase/config'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
  doc,
  getDocs,
} from 'firebase/firestore'
import { User } from '@/types/user'
import { WebRTCSession, CallType } from '@/types/webrtc'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatMessageTime, formatDuration } from '@/lib/utils/formatTime'
import { cn } from '@/lib/utils/cn'

interface CallLogItem {
  session: WebRTCSession
  otherUser: User | null
  direction: 'incoming' | 'outgoing' | 'missed'
}

export function CallsPage() {
  const { user, uid } = useAuthStore()
  const {
    localStream,
    remoteStream,
    callStatus,
    incomingCall,
    initCall,
    answerCall,
    endCall,
  } = useWebRTC()

  const [activeTab, setActiveTab] = useState<'all' | 'missed' | 'dialer'>('all')
  const [callLogs, setCallLogs] = useState<CallLogItem[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [usersList, setUsersList] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // In-call local states
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoDisabled, setIsVideoDisabled] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [currentCallUser, setCurrentCallUser] = useState<User | null>(null)
  const [activeCallType, setActiveCallType] = useState<CallType>('audio')

  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const userCache = useRef<Record<string, User>>({})

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream, callStatus])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream, callStatus])

  // Call duration counter
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      setCallDuration(0)
    }
    return () => clearInterval(interval)
  }, [callStatus])

  // Toggle microphone audio track
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  // Toggle video track
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoDisabled(!isVideoDisabled)
    }
  }

  // Fetch caller details for incoming call
  const [incomingCaller, setIncomingCaller] = useState<User | null>(null)
  useEffect(() => {
    if (incomingCall?.callerId) {
      const fetchCaller = async () => {
        if (userCache.current[incomingCall.callerId]) {
          setIncomingCaller(userCache.current[incomingCall.callerId])
          return
        }
        try {
          const userSnap = await getDoc(doc(db, 'users', incomingCall.callerId))
          if (userSnap.exists()) {
            const userData = { uid: userSnap.id, ...userSnap.data() } as User
            userCache.current[incomingCall.callerId] = userData
            setIncomingCaller(userData)
          }
        } catch (err) {
          console.error('Error fetching incoming caller:', err)
        }
      }
      fetchCaller()
    } else {
      setIncomingCaller(null)
    }
  }, [incomingCall])

  // Subscribe to call history logs
  useEffect(() => {
    if (!uid) return

    const sessionsQuery = query(
      collection(db, 'webrtcSessions'),
      where('callerId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(25)
    )

    const calleeQuery = query(
      collection(db, 'webrtcSessions'),
      where('calleeId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(25)
    )

    let callerSessions: WebRTCSession[] = []
    let calleeSessions: WebRTCSession[] = []

    const processSessions = async () => {
      const combined = [...callerSessions, ...calleeSessions].sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() ?? 0
        const timeB = b.createdAt?.toMillis?.() ?? 0
        return timeB - timeA
      })

      const items: CallLogItem[] = []
      for (const session of combined) {
        const otherUid = session.callerId === uid ? session.calleeId : session.callerId
        if (!otherUid) continue

        if (!userCache.current[otherUid]) {
          try {
            const uSnap = await getDoc(doc(db, 'users', otherUid))
            if (uSnap.exists()) {
              userCache.current[otherUid] = { uid: uSnap.id, ...uSnap.data() } as User
            }
          } catch (e) {
            console.error('Error caching user:', e)
          }
        }

        const otherUser = userCache.current[otherUid] ?? null
        let direction: 'incoming' | 'outgoing' | 'missed' = 'outgoing'
        if (session.calleeId === uid) {
          direction = session.status === 'ended' && !session.answer ? 'missed' : 'incoming'
        }

        items.push({
          session,
          otherUser,
          direction,
        })
      }

      setCallLogs(items)
      setLoadingLogs(false)
    }

    const unsubCaller = onSnapshot(sessionsQuery, (snap) => {
      callerSessions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WebRTCSession))
      processSessions()
    }, (err) => {
      console.warn('Caller query index note:', err)
      setLoadingLogs(false)
    })

    const unsubCallee = onSnapshot(calleeQuery, (snap) => {
      calleeSessions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WebRTCSession))
      processSessions()
    }, (err) => {
      console.warn('Callee query index note:', err)
      setLoadingLogs(false)
    })

    return () => {
      unsubCaller()
      unsubCallee()
    }
  }, [uid])

  // Search users for new call
  useEffect(() => {
    if (!uid) return
    const fetchUsers = async () => {
      setLoadingUsers(true)
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), limit(50)))
        const list: User[] = []
        usersSnap.forEach((docSnap) => {
          if (docSnap.id !== uid) {
            list.push({ uid: docSnap.id, ...docSnap.data() } as User)
          }
        })
        setUsersList(list)
      } catch (err) {
        console.error('Error loading users:', err)
      } finally {
        setLoadingUsers(false)
      }
    }
    fetchUsers()
  }, [uid])

  const handleStartCall = async (targetUser: User, type: CallType) => {
    setCurrentCallUser(targetUser)
    setActiveCallType(type)
    setIsMuted(false)
    setIsVideoDisabled(false)
    await initCall(targetUser.uid, type)
  }

  const handleAnswerIncoming = async () => {
    if (!incomingCall) return
    setActiveCallType(incomingCall.type)
    if (incomingCaller) {
      setCurrentCallUser(incomingCaller)
    }
    await answerCall(incomingCall.sessionId)
  }

  const filteredLogs = callLogs.filter((item) => {
    if (activeTab === 'missed') {
      return item.direction === 'missed'
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        item.otherUser?.displayName?.toLowerCase().includes(q) ||
        item.otherUser?.username?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const filteredUsers = usersList.filter((u) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      u.displayName?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    )
  })

  const isInActiveCall = callStatus === 'calling' || callStatus === 'ringing' || callStatus === 'connected'

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Phone className="w-6 h-6 text-blue-600" />
              Calls
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              High-definition WebRTC voice and video calls
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                activeTab === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              All Calls
            </button>
            <button
              onClick={() => setActiveTab('missed')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1',
                activeTab === 'missed'
                  ? 'bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              Missed
            </button>
            <button
              onClick={() => setActiveTab('dialer')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1',
                activeTab === 'dialer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              <UserPlus className="w-3.5 h-3.5" />
              New Call
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'dialer'
                ? 'Search users to call...'
                : 'Search call history...'
            }
            className="pl-9 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
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
      <div className="flex-1 overflow-hidden p-4 md:p-6">
        {activeTab === 'dialer' ? (
          /* User Directory / Start New Call */
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Direct Contacts ({filteredUsers.length})
              </h2>
            </div>
            <ScrollArea className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-2">
              {loadingUsers ? (
                <div className="py-12 text-center text-sm text-zinc-500">
                  Loading contacts...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <UserIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No contacts found</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredUsers.map((targetUser) => (
                    <div
                      key={targetUser.uid}
                      className="p-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <Avatar className="w-11 h-11 border border-zinc-200 dark:border-zinc-700">
                            <AvatarImage src={targetUser.photoURL || ''} />
                            <AvatarFallback className="font-semibold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
                              {targetUser.displayName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {targetUser.presence === 'online' && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {targetUser.displayName}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            @{targetUser.username || targetUser.email?.split('@')[0]}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartCall(targetUser, 'audio')}
                          disabled={isInActiveCall}
                          className="text-zinc-700 dark:text-zinc-200 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Start Voice Call"
                        >
                          <Phone className="w-4 h-4 mr-1.5 text-emerald-600" />
                          Audio
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartCall(targetUser, 'video')}
                          disabled={isInActiveCall}
                          className="text-zinc-700 dark:text-zinc-200 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Start Video Call"
                        >
                          <Video className="w-4 h-4 mr-1.5 text-blue-600" />
                          Video
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          /* Call History Logs */
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            <ScrollArea className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-2">
              {loadingLogs ? (
                <div className="py-12 text-center text-sm text-zinc-500">
                  Loading call history...
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="py-16 text-center text-zinc-500">
                  <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                    <PhoneOff className="w-7 h-7 text-zinc-400" />
                  </div>
                  <p className="font-semibold text-base text-zinc-800 dark:text-zinc-200">
                    {activeTab === 'missed' ? 'No missed calls' : 'No call history yet'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    {activeTab === 'missed'
                      ? 'You have answered all incoming calls.'
                      : 'Connect instantly with your peers via encrypted crystal-clear voice or video calls.'}
                  </p>
                  <Button
                    onClick={() => setActiveTab('dialer')}
                    variant="outline"
                    className="mt-4 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Start a New Call
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredLogs.map(({ session, otherUser, direction }) => {
                    const isVideo = session.type === 'video'
                    const callTime = session.createdAt ? formatMessageTime(session.createdAt) : ''

                    return (
                      <div
                        key={session.id}
                        className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <Avatar className="w-11 h-11 border border-zinc-200 dark:border-zinc-700">
                            <AvatarImage src={otherUser?.photoURL || ''} />
                            <AvatarFallback className="font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              {otherUser?.displayName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                                {otherUser?.displayName || 'Unknown User'}
                              </p>
                              {isVideo ? (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                  <Video className="w-2.5 h-2.5 mr-1" />
                                  Video
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                  <Phone className="w-2.5 h-2.5 mr-1" />
                                  Audio
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {direction === 'incoming' && (
                                <span className="flex items-center text-emerald-600 font-medium">
                                  <PhoneIncoming className="w-3.5 h-3.5 mr-1" />
                                  Incoming
                                </span>
                              )}
                              {direction === 'outgoing' && (
                                <span className="flex items-center text-blue-600 font-medium">
                                  <PhoneOutgoing className="w-3.5 h-3.5 mr-1" />
                                  Outgoing
                                </span>
                              )}
                              {direction === 'missed' && (
                                <span className="flex items-center text-red-500 font-medium">
                                  <PhoneMissed className="w-3.5 h-3.5 mr-1" />
                                  Missed
                                </span>
                              )}
                              <span>•</span>
                              <span>{callTime}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Callback Button */}
                        {otherUser && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartCall(otherUser, isVideo ? 'video' : 'audio')}
                              disabled={isInActiveCall}
                              className="text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                              title={`Call back ${otherUser.displayName}`}
                            >
                              {isVideo ? (
                                <Video className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Phone className="w-4 h-4 text-emerald-600" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Incoming Call Overlay / Modal */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-sm w-full text-center animate-in fade-in zoom-in-95">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
              <Avatar className="w-24 h-24 border-4 border-white dark:border-zinc-800 shadow-lg">
                <AvatarImage src={incomingCaller?.photoURL || ''} />
                <AvatarFallback className="text-3xl font-bold bg-blue-600 text-white">
                  {incomingCaller?.displayName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>

            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {incomingCaller?.displayName || 'Incoming Call'}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center justify-center gap-1.5">
              {incomingCall.type === 'video' ? (
                <>
                  <Video className="w-4 h-4 text-blue-600" />
                  Incoming Video Call...
                </>
              ) : (
                <>
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  Incoming Audio Call...
                </>
              )}
            </p>

            <div className="flex items-center justify-center gap-6 mt-8">
              <button
                onClick={() => endCall()}
                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                title="Decline"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                onClick={handleAnswerIncoming}
                className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                title="Accept"
              >
                <Phone className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Call In-Progress Screen / Modal */}
      {isInActiveCall && (
        <div className="fixed inset-0 z-50 bg-zinc-950 text-white flex flex-col">
          {/* Active Call Top Bar */}
          <div className="p-4 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-zinc-700">
                <AvatarImage src={currentCallUser?.photoURL || ''} />
                <AvatarFallback className="bg-zinc-800 text-zinc-200">
                  {currentCallUser?.displayName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-sm">
                  {currentCallUser?.displayName || 'Encrypted Call'}
                </h4>
                <p className="text-xs text-zinc-400">
                  {callStatus === 'calling' && 'Calling...'}
                  {callStatus === 'ringing' && 'Ringing...'}
                  {callStatus === 'connected' && `Connected (${formatDuration(callDuration)})`}
                </p>
              </div>
            </div>

            <Badge
              variant={callStatus === 'connected' ? 'success' : 'warning'}
              className="text-xs px-2.5 py-0.5"
            >
              {callStatus === 'connected' ? 'Secure Peer-to-Peer' : 'Establishing connection'}
            </Badge>
          </div>

          {/* Video / Audio Canvas Body */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-900 to-black p-4">
            {activeCallType === 'video' ? (
              <div className="relative w-full h-full max-w-4xl max-h-[75vh] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                {/* Remote Video */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {!remoteStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                    <Avatar className="w-24 h-24 mb-4 ring-4 ring-zinc-700">
                      <AvatarImage src={currentCallUser?.photoURL || ''} />
                      <AvatarFallback className="text-3xl font-bold bg-zinc-800 text-zinc-200">
                        {currentCallUser?.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium">Waiting for video stream...</p>
                  </div>
                )}

                {/* Local Video Picture-in-Picture */}
                <div className="absolute bottom-4 right-4 w-36 h-48 sm:w-48 sm:h-64 rounded-xl overflow-hidden border-2 border-zinc-700 bg-zinc-800 shadow-2xl z-10">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isVideoDisabled && (
                    <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center text-xs text-zinc-400">
                      Camera Off
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-zinc-300">
                    You
                  </span>
                </div>
              </div>
            ) : (
              /* Audio Call Center Stage */
              <div className="text-center">
                <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center">
                  {callStatus === 'connected' && (
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                  )}
                  <Avatar className="w-36 h-36 border-4 border-zinc-700 shadow-2xl">
                    <AvatarImage src={currentCallUser?.photoURL || ''} />
                    <AvatarFallback className="text-5xl font-bold bg-blue-600 text-white">
                      {currentCallUser?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <h2 className="text-2xl font-bold mb-1">
                  {currentCallUser?.displayName || 'Audio Call'}
                </h2>
                <p className="text-zinc-400 text-sm mb-4">
                  {callStatus === 'connected'
                    ? formatDuration(callDuration)
                    : callStatus === 'ringing'
                    ? 'Ringing...'
                    : 'Calling...'}
                </p>
                <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-xs text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  End-to-End Encrypted WebRTC Session
                </div>
              </div>
            )}
          </div>

          {/* Active Call Controls Bottom Bar */}
          <div className="p-6 bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800 flex items-center justify-center gap-4">
            <button
              onClick={toggleMute}
              className={cn(
                'w-13 h-13 p-3 rounded-full flex items-center justify-center transition-all',
                isMuted
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              )}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {activeCallType === 'video' && (
              <button
                onClick={toggleVideo}
                className={cn(
                  'w-13 h-13 p-3 rounded-full flex items-center justify-center transition-all',
                  isVideoDisabled
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                )}
                title={isVideoDisabled ? 'Enable Camera' : 'Disable Camera'}
              >
                {isVideoDisabled ? (
                  <VideoOff className="w-5 h-5" />
                ) : (
                  <Video className="w-5 h-5" />
                )}
              </button>
            )}

            <button
              onClick={() => endCall()}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
