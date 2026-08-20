'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuthStore } from '@/store/authStore'

type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed'
type CallType = 'audio' | 'video'

interface IncomingCall {
  sessionId: string
  callerId: string
  type: CallType
}

interface UseWebRTCReturn {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  callStatus: CallStatus
  incomingCall: IncomingCall | null
  initCall: (calleeId: string, type: CallType) => Promise<void>
  answerCall: (sessionId: string) => Promise<void>
  endCall: () => Promise<void>
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export function useWebRTC(): UseWebRTCReturn {
  const uid = useAuthStore((s) => s.uid)

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const unsubscribeAnswerRef = useRef<(() => void) | null>(null)
  const unsubscribeCandidatesRef = useRef<(() => void) | null>(null)

  // Listen for incoming calls directed to this user
  useEffect(() => {
    if (!uid) return

    const sessionsRef = collection(db, 'webrtcSessions')
    // We listen for sessions where this user is the callee and status is 'ringing'
    const unsubscribe = onSnapshot(
      sessionsRef,
      (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data()
            if (
              data.calleeId === uid &&
              data.status === 'ringing' &&
              callStatus === 'idle'
            ) {
              setIncomingCall({
                sessionId: change.doc.id,
                callerId: data.callerId,
                type: data.type ?? 'audio',
              })
            }
          }
        })
      },
      (err) => console.error('[useWebRTC] incoming call listener error:', err)
    )

    return () => unsubscribe()
  }, [uid, callStatus])

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    if (unsubscribeAnswerRef.current) {
      unsubscribeAnswerRef.current()
      unsubscribeAnswerRef.current = null
    }
    if (unsubscribeCandidatesRef.current) {
      unsubscribeCandidatesRef.current()
      unsubscribeCandidatesRef.current = null
    }
    localStream?.getTracks().forEach((t) => t.stop())
    setLocalStream(null)
    setRemoteStream(null)
    sessionIdRef.current = null
  }, [localStream])

  const initCall = useCallback(
    async (calleeId: string, type: CallType) => {
      if (!uid) return
      setCallStatus('calling')

      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video',
        })
        setLocalStream(stream)

        const pc = new RTCPeerConnection(ICE_SERVERS)
        pcRef.current = pc

        // Add local tracks
        stream.getTracks().forEach((track) => pc.addTrack(track, stream))

        // Set up remote stream
        const remote = new MediaStream()
        setRemoteStream(remote)
        pc.ontrack = (event) => {
          event.streams[0]?.getTracks().forEach((track) => remote.addTrack(track))
        }

        // Create Firestore session
        const sessionRef = await addDoc(collection(db, 'webrtcSessions'), {
          callerId: uid,
          calleeId,
          type,
          status: 'ringing',
          createdAt: serverTimestamp(),
        })
        sessionIdRef.current = sessionRef.id

        // Send caller ICE candidates to Firestore
        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            await addDoc(
              collection(db, 'webrtcSessions', sessionRef.id, 'callerCandidates'),
              event.candidate.toJSON()
            )
          }
        }

        // Create offer
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        await updateDoc(sessionRef, {
          offer: { sdp: offer.sdp, type: offer.type },
        })

        // Listen for answer
        const unsubAnswer = onSnapshot(sessionRef, async (snap) => {
          const data = snap.data()
          if (data?.answer && !pc.currentRemoteDescription) {
            const answer = new RTCSessionDescription(data.answer)
            await pc.setRemoteDescription(answer)
            setCallStatus('connected')
          }
          if (data?.status === 'ended') {
            endCall()
          }
        })
        unsubscribeAnswerRef.current = unsubAnswer

        // Listen for callee ICE candidates
        const unsubCandidates = onSnapshot(
          collection(db, 'webrtcSessions', sessionRef.id, 'calleeCandidates'),
          (snap) => {
            snap.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data())
                pc.addIceCandidate(candidate).catch(() => {})
              }
            })
          }
        )
        unsubscribeCandidatesRef.current = unsubCandidates
      } catch (err) {
        console.error('[useWebRTC] initCall error:', err)
        setCallStatus('failed')
        cleanup()
      }
    },
    [uid, cleanup]
  )

  const answerCall = useCallback(
    async (sessionId: string) => {
      if (!uid) return
      setCallStatus('ringing')
      setIncomingCall(null)

      try {
        const sessionRef = doc(db, 'webrtcSessions', sessionId)
        const sessionSnap = await getDoc(sessionRef)
        if (!sessionSnap.exists()) {
          setCallStatus('failed')
          return
        }

        const sessionData = sessionSnap.data()
        const type: CallType = sessionData.type ?? 'audio'

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video',
        })
        setLocalStream(stream)

        const pc = new RTCPeerConnection(ICE_SERVERS)
        pcRef.current = pc
        sessionIdRef.current = sessionId

        stream.getTracks().forEach((track) => pc.addTrack(track, stream))

        const remote = new MediaStream()
        setRemoteStream(remote)
        pc.ontrack = (event) => {
          event.streams[0]?.getTracks().forEach((track) => remote.addTrack(track))
        }

        // Send callee ICE candidates
        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            await addDoc(
              collection(db, 'webrtcSessions', sessionId, 'calleeCandidates'),
              event.candidate.toJSON()
            )
          }
        }

        // Set remote description from offer
        await pc.setRemoteDescription(new RTCSessionDescription(sessionData.offer))

        // Create answer
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        await updateDoc(sessionRef, {
          answer: { sdp: answer.sdp, type: answer.type },
          status: 'connected',
        })
        setCallStatus('connected')

        // Listen for caller ICE candidates
        const unsubCandidates = onSnapshot(
          collection(db, 'webrtcSessions', sessionId, 'callerCandidates'),
          (snap) => {
            snap.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data())
                pc.addIceCandidate(candidate).catch(() => {})
              }
            })
          }
        )
        unsubscribeCandidatesRef.current = unsubCandidates

        // Listen for session end
        const unsubSession = onSnapshot(sessionRef, (snap) => {
          if (snap.data()?.status === 'ended') {
            endCall()
          }
        })
        unsubscribeAnswerRef.current = unsubSession
      } catch (err) {
        console.error('[useWebRTC] answerCall error:', err)
        setCallStatus('failed')
        cleanup()
      }
    },
    [uid, cleanup]
  )

  const endCall = useCallback(async () => {
    if (sessionIdRef.current) {
      try {
        await updateDoc(doc(db, 'webrtcSessions', sessionIdRef.current), {
          status: 'ended',
          endedAt: serverTimestamp(),
        })
      } catch (err) {
        console.error('[useWebRTC] endCall update error:', err)
      }
    }
    setCallStatus('ended')
    cleanup()
    // Reset to idle after brief delay
    setTimeout(() => setCallStatus('idle'), 1500)
  }, [cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    localStream,
    remoteStream,
    callStatus,
    incomingCall,
    initCall,
    answerCall,
    endCall,
  }
}
