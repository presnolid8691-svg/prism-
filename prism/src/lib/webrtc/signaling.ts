import {
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import {
  webrtcSessionRef,
  webrtcSessionsRef,
  callerCandidatesRef,
  calleeCandidatesRef,
} from '@/lib/firebase/firestore'
import type { CallType } from '@/types/webrtc'

/**
 * Create a new WebRTC session document in Firestore.
 *
 * @returns The newly created session ID.
 */
export async function createCall(
  callerId: string,
  calleeId: string,
  type: CallType,
): Promise<string> {
  const docRef = await addDoc(webrtcSessionsRef(), {
    callerId,
    calleeId,
    type,
    status: 'ringing',
    offer: null,
    answer: null,
    createdAt: serverTimestamp(),
    endedAt: null,
  })

  return docRef.id
}

/**
 * Initiate a call as the caller.
 * Creates an SDP offer, writes it to Firestore, and starts collecting
 * ICE candidates which are written to the callerCandidates subcollection.
 */
export async function startCall(
  sessionId: string,
  pc: RTCPeerConnection,
): Promise<void> {
  const candidatesRef = callerCandidatesRef(sessionId)
  const sessionRef = webrtcSessionRef(sessionId)

  // Collect ICE candidates as they are discovered
  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      await addDoc(candidatesRef, {
        candidate: event.candidate.toJSON(),
        createdAt: serverTimestamp(),
      })
    }
  }

  // Create and set local offer
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)

  await updateDoc(sessionRef, {
    offer: { type: offer.type, sdp: offer.sdp },
    status: 'ringing',
  })
}

/**
 * Answer an incoming call as the callee.
 * Reads the caller's offer from Firestore, creates an SDP answer,
 * writes it back, and starts collecting callee ICE candidates.
 */
export async function answerCall(
  sessionId: string,
  pc: RTCPeerConnection,
): Promise<void> {
  const sessionRef = webrtcSessionRef(sessionId)
  const callerCandRef = callerCandidatesRef(sessionId)
  const calleeCandRef = calleeCandidatesRef(sessionId)

  // Collect callee ICE candidates
  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      await addDoc(calleeCandRef, {
        candidate: event.candidate.toJSON(),
        createdAt: serverTimestamp(),
      })
    }
  }

  // Read the offer from Firestore
  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(sessionRef, async (snap) => {
      try {
        const data = snap.data()
        if (!data?.offer) return

        unsubscribe()

        // Set remote offer
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer))

        // Add existing caller ICE candidates
        const candSnap = await new Promise<RTCIceCandidateInit[]>(
          (res) => {
            const unsub = onSnapshot(callerCandRef, (s) => {
              unsub()
              res(s.docs.map((d) => d.data().candidate as RTCIceCandidateInit))
            })
          },
        )
        for (const cand of candSnap) {
          await pc.addIceCandidate(new RTCIceCandidate(cand))
        }

        // Create and write answer
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        await updateDoc(sessionRef, {
          answer: { type: answer.type, sdp: answer.sdp },
          status: 'active',
        })

        resolve()
      } catch (err) {
        reject(err)
      }
    })
  })
}

/**
 * Listen for the callee's answer and apply remote callee ICE candidates.
 * Should be called by the caller after startCall().
 *
 * @param cleanup - Called when the call ends or is rejected
 * @returns       Unsubscribe function
 */
export async function listenForAnswer(
  sessionId: string,
  pc: RTCPeerConnection,
  cleanup: () => void,
): Promise<() => void> {
  const sessionRef = webrtcSessionRef(sessionId)
  const calleeCandRef = calleeCandidatesRef(sessionId)

  let calleeCandUnsubscribe: (() => void) | null = null

  const unsubscribe = onSnapshot(sessionRef, async (snap) => {
    const data = snap.data()
    if (!data) return

    // Apply answer when callee responds
    if (data.answer && !pc.currentRemoteDescription) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer))

      // Now start listening for callee's ICE candidates
      calleeCandUnsubscribe = onSnapshot(calleeCandRef, async (candSnap) => {
        for (const change of candSnap.docChanges()) {
          if (change.type === 'added') {
            const cand = change.doc.data().candidate as RTCIceCandidateInit
            await pc.addIceCandidate(new RTCIceCandidate(cand))
          }
        }
      })
    }

    // Handle call termination
    if (data.status === 'ended' || data.status === 'rejected') {
      calleeCandUnsubscribe?.()
      cleanup()
    }
  })

  return () => {
    unsubscribe()
    calleeCandUnsubscribe?.()
  }
}

/**
 * Terminate an active or ringing call by setting status to 'ended'.
 */
export async function endCall(sessionId: string): Promise<void> {
  await updateDoc(webrtcSessionRef(sessionId), {
    status: 'ended',
    endedAt: serverTimestamp(),
  })
}
