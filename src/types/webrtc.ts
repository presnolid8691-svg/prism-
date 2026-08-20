import { Timestamp } from 'firebase/firestore'

export type CallType = 'audio' | 'video'
export type CallStatus = 'ringing' | 'active' | 'ended' | 'rejected'

export interface WebRTCSession {
  id: string
  callerId: string
  calleeId: string
  type: CallType
  status: CallStatus
  offer: RTCSessionDescriptionInit | null
  answer: RTCSessionDescriptionInit | null
  createdAt: Timestamp
  endedAt: Timestamp | null
}

export interface ICECandidate {
  candidate: RTCIceCandidateInit
  createdAt: Timestamp
}
