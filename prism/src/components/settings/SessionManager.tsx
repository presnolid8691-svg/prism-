'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Shield,
  ShieldAlert,
  ArrowLeft,
  Trash2,
  LogOut,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { db } from '@/lib/firebase/config'
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { SessionDevice, User } from '@/types/user'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatStoryTime, formatMessageTime } from '@/lib/utils/formatTime'
import { cn } from '@/lib/utils/cn'

function parseDeviceName(userAgent: string): { name: string; type: 'desktop' | 'mobile' | 'tablet' | 'browser' } {
  const ua = userAgent.toLowerCase()
  let type: 'desktop' | 'mobile' | 'tablet' | 'browser' = 'desktop'
  let name = 'Prism Web Client'

  if (ua.includes('android')) {
    type = 'mobile'
    name = 'Prism for Android'
  } else if (ua.includes('iphone') || ua.includes('ipod')) {
    type = 'mobile'
    name = 'Prism for iOS'
  } else if (ua.includes('ipad')) {
    type = 'tablet'
    name = 'Prism for iPad'
  } else if (ua.includes('electron')) {
    type = 'desktop'
    name = 'Prism Desktop App'
  } else if (ua.includes('windows')) {
    type = 'desktop'
    name = 'Chrome on Windows'
  } else if (ua.includes('macintosh') || ua.includes('mac os')) {
    type = 'desktop'
    name = 'Safari on macOS'
  } else if (ua.includes('linux')) {
    type = 'desktop'
    name = 'Firefox on Linux'
  }

  return { name, type }
}

export function SessionManager() {
  const { user, uid } = useAuthStore()
  const [sessions, setSessions] = useState<SessionDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [terminatingId, setTerminatingId] = useState<string | null>(null)
  const [terminatingAll, setTerminatingAll] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const currentDeviceId = typeof window !== 'undefined'
    ? localStorage.getItem('prism_device_id') || 'current-browser-device'
    : 'current-browser-device'

  // Register current device & listen to session devices
  useEffect(() => {
    if (!uid) return

    if (typeof window !== 'undefined' && !localStorage.getItem('prism_device_id')) {
      localStorage.setItem('prism_device_id', 'device_' + Math.random().toString(36).substring(2, 9))
    }

    const userDocRef = doc(db, 'users', uid)
    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as User
        let deviceList = userData.sessionDevices || []

        // If no devices registered yet, create default current device
        if (deviceList.length === 0 && typeof window !== 'undefined') {
          const { name } = parseDeviceName(navigator.userAgent)
          const newCurrentDevice: SessionDevice = {
            deviceId: localStorage.getItem('prism_device_id') || 'dev_current',
            deviceName: name,
            lastActive: Timestamp.now(),
            userAgent: navigator.userAgent,
          }
          deviceList = [newCurrentDevice]
          try {
            await updateDoc(userDocRef, { sessionDevices: deviceList })
          } catch (e) {
            console.error('Error seeding device:', e)
          }
        }

        setSessions(deviceList)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [uid])

  // Terminate a single session
  const handleTerminateSession = async (deviceId: string) => {
    if (!uid) return
    setTerminatingId(deviceId)

    try {
      const updated = sessions.filter((s) => s.deviceId !== deviceId)
      await updateDoc(doc(db, 'users', uid), {
        sessionDevices: updated,
      })
    } catch (err) {
      console.error('Error terminating session:', err)
    } finally {
      setTerminatingId(null)
    }
  }

  // Terminate all sessions except this one
  const handleTerminateAllOtherSessions = async () => {
    if (!uid) return
    setTerminatingAll(true)

    try {
      const thisSession = sessions.find((s) => s.deviceId === currentDeviceId) || {
        deviceId: currentDeviceId,
        deviceName: parseDeviceName(navigator.userAgent).name,
        lastActive: Timestamp.now(),
        userAgent: navigator.userAgent,
      }
      await updateDoc(doc(db, 'users', uid), {
        sessionDevices: [thisSession],
      })
      setShowConfirmModal(false)
    } catch (err) {
      console.error('Error terminating all other sessions:', err)
    } finally {
      setTerminatingAll(false)
    }
  }

  // Split into current session vs other sessions
  const currentSession = sessions.find((s) => s.deviceId === currentDeviceId) || sessions[0]
  const otherSessions = sessions.filter((s) => s.deviceId !== currentSession?.deviceId)

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600" />
                Active Sessions
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Manage and log out active devices connected to your account
              </p>
            </div>
          </div>

          {otherSessions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowConfirmModal(true)}
              className="text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Terminate Other Sessions
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Current Device Section */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 px-1">
              Current Device
            </h2>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border-2 border-blue-500/40 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                        {currentSession ? currentSession.deviceName : 'This Device'}
                      </h3>
                      <Badge variant="success" className="text-[10px]">
                        Online Now
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        This Device
                      </Badge>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono break-all max-w-xl">
                      {currentSession?.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Web client')}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        Current Location
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active & Synced
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Other Active Sessions List */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Other Active Devices ({otherSessions.length})
              </h2>
            </div>

            {loading ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-sm text-zinc-500">
                Loading active sessions...
              </div>
            ) : otherSessions.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 mb-1">
                  No other active sessions
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  You are currently only logged in on this device. Your account security is intact.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden shadow-sm">
                {otherSessions.map((session) => {
                  const { name, type } = parseDeviceName(session.userAgent || '')
                  const timeAgo = session.lastActive ? formatStoryTime(session.lastActive) : 'recently'

                  return (
                    <div
                      key={session.deviceId}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
                          {type === 'mobile' ? (
                            <Smartphone className="w-5 h-5" />
                          ) : type === 'tablet' ? (
                            <Tablet className="w-5 h-5" />
                          ) : (
                            <Monitor className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                              {session.deviceName || name}
                            </h4>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            Last active: {timeAgo}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate max-w-md mt-0.5 font-mono">
                            {session.userAgent}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTerminateSession(session.deviceId)}
                        disabled={terminatingId === session.deviceId}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        {terminatingId === session.deviceId ? 'Revoking...' : 'Revoke'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Security Advisory Card */}
          <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                  Security & Multi-Device Encryption
                </h4>
                <p className="text-xs text-amber-800/80 dark:text-amber-400/80 mt-1 leading-relaxed">
                  Prism uses cryptographic ratchets for end-to-end secret chat sessions. When you revoke a session, its encryption keys are permanently deleted and the device is logged out immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-center text-zinc-900 dark:text-zinc-100 mb-2">
              Log out all other sessions?
            </h3>
            <p className="text-xs text-zinc-500 text-center mb-6 leading-relaxed">
              This will immediately disconnect and sign out all other devices and web browsers. You will stay signed in on this current device.
            </p>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleTerminateAllOtherSessions}
                disabled={terminatingAll}
                className="flex-1"
              >
                {terminatingAll ? 'Terminating...' : 'Yes, Log Out Others'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
