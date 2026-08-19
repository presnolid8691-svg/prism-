'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface VoiceRecorderResult {
  blob: Blob
  waveformData: number[]
  durationSecs: number
}

interface UseVoiceRecorderReturn {
  startRecording: () => Promise<void>
  stopRecording: () => Promise<VoiceRecorderResult>
  isRecording: boolean
  duration: number
  permissionDenied: boolean
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const amplitudeDataRef = useRef<number[]>([])
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const amplitudeSamplerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current)
      if (amplitudeSamplerRef.current) clearInterval(amplitudeSamplerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioContextRef.current?.close().catch(() => {})
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (isRecording) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setPermissionDenied(false)

      // Set up AudioContext + AnalyserNode for waveform data
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      amplitudeDataRef.current = []

      // Sample amplitude every 100ms
      amplitudeSamplerRef.current = setInterval(() => {
        if (!analyserRef.current) return
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        amplitudeDataRef.current.push(Math.round(avg))
      }, 100)

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start(100) // collect data every 100ms
      startTimeRef.current = Date.now()
      setIsRecording(true)
      setDuration(0)

      // Tick duration counter
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true)
      } else {
        console.error('[useVoiceRecorder] startRecording error:', err)
      }
    }
  }, [isRecording])

  const stopRecording = useCallback((): Promise<VoiceRecorderResult> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || !isRecording) {
        reject(new Error('Not recording'))
        return
      }

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
      if (amplitudeSamplerRef.current) {
        clearInterval(amplitudeSamplerRef.current)
        amplitudeSamplerRef.current = null
      }

      const durationSecs = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const waveformData = [...amplitudeDataRef.current]

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorderRef.current?.mimeType ?? 'audio/webm',
        })

        // Cleanup
        streamRef.current?.getTracks().forEach((t) => t.stop())
        audioContextRef.current?.close().catch(() => {})
        streamRef.current = null
        audioContextRef.current = null
        analyserRef.current = null
        mediaRecorderRef.current = null
        chunksRef.current = []

        setIsRecording(false)
        setDuration(0)

        resolve({ blob, waveformData, durationSecs })
      }

      mediaRecorderRef.current.stop()
    })
  }, [isRecording])

  return { startRecording, stopRecording, isRecording, duration, permissionDenied }
}
