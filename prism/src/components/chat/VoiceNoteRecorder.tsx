'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Mic,
  Square,
  Trash2,
  Send,
  Play,
  Pause,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import { formatDuration } from '@/lib/utils/formatTime'
import { cn } from '@/lib/utils/cn'
import { useAuthStore } from '@/store/authStore'
import { uploadMedia } from '@/lib/supabase/storage'

export interface VoiceNoteRecorderProps {
  /** Triggered when the voice note is finalized and sent */
  onSendVoiceNote?: (
    blob: Blob,
    waveformData: number[],
    durationSecs: number,
    publicUrl?: string
  ) => void | Promise<void>
  /** Alias for onSendVoiceNote */
  onSend?: (
    blob: Blob,
    waveformData: number[],
    durationSecs: number,
    publicUrl?: string
  ) => void | Promise<void>
  /** Triggered when recording is cancelled / closed */
  onCancel?: () => void
  /** Chat ID */
  chatId?: string
  /** Whether the component is disabled */
  disabled?: boolean
  /** Custom classes */
  className?: string
  /** Maximum recording duration in seconds (default 300 = 5 mins) */
  maxDurationSecs?: number
}

interface RecordedAudioData {
  blob: Blob
  url: string
  waveformData: number[]
  durationSecs: number
}

/**
 * VoiceNoteRecorder with live amplitude visualizer, hands-free lock, review player, and audio upload.
 */
export function VoiceNoteRecorder({
  onSendVoiceNote,
  onSend,
  onCancel,
  chatId,
  disabled = false,
  className,
  maxDurationSecs = 300,
}: VoiceNoteRecorderProps) {
  const { user } = useAuthStore()

  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [recordedData, setRecordedData] = useState<RecordedAudioData | null>(null)

  // Audio Preview Playback state
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [previewTime, setPreviewTime] = useState(0)

  // Real-time audio amplitude for live visualizer
  const [liveAmplitudes, setLiveAmplitudes] = useState<number[]>([10, 20, 15, 30, 25])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const amplitudeHistoryRef = useRef<number[]>([])
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioContextRef.current?.close().catch(() => {})
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
      }
    }
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    if (disabled || isRecording) return
    setPermissionDenied(false)
    setRecordedData(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // AudioContext + AnalyserNode for live visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)
      analyserRef.current = analyser

      amplitudeHistoryRef.current = []

      // Visualizer animation loop
      const updateVisualizer = () => {
        if (!analyserRef.current) return
        const data = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        const normalized = Math.max(10, Math.min(100, Math.round((avg / 255) * 100)))

        amplitudeHistoryRef.current.push(normalized)
        setLiveAmplitudes((prev) => [...prev.slice(-16), normalized])

        animFrameRef.current = requestAnimationFrame(updateVisualizer)
      }
      animFrameRef.current = requestAnimationFrame(updateVisualizer)

      // MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start(100)
      startTimeRef.current = Date.now()
      setIsRecording(true)
      setDuration(0)

      timerIntervalRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setDuration(secs)
        if (secs >= maxDurationSecs) {
          stopRecordingAndPreview()
        }
      }, 1000)
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true)
      } else {
        console.error('[VoiceNoteRecorder] startRecording error:', err)
      }
    }
  }, [disabled, isRecording, maxDurationSecs])

  // Stop recording and create blob
  const stopRecordingInternal = useCallback((): Promise<RecordedAudioData> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || !isRecording) {
        reject(new Error('Not recording'))
        return
      }

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }

      const durationSecs = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000))
      const waveformData = [...amplitudeHistoryRef.current]

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorderRef.current?.mimeType ?? 'audio/webm',
        })
        const url = URL.createObjectURL(blob)

        // Cleanup audio graph
        streamRef.current?.getTracks().forEach((t) => t.stop())
        audioContextRef.current?.close().catch(() => {})
        streamRef.current = null
        audioContextRef.current = null
        analyserRef.current = null
        mediaRecorderRef.current = null
        chunksRef.current = []

        setIsRecording(false)

        resolve({ blob, url, waveformData, durationSecs })
      }

      mediaRecorderRef.current.stop()
    })
  }, [isRecording])

  // Stop recording & enter review mode
  const stopRecordingAndPreview = async () => {
    try {
      const data = await stopRecordingInternal()
      setRecordedData(data)
    } catch (err) {
      console.error('[VoiceNoteRecorder] stopRecording error:', err)
    }
  }

  // Cancel & discard recording
  const handleCancel = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioContextRef.current?.close().catch(() => {})
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }

    setIsRecording(false)
    setRecordedData(null)
    setDuration(0)
    onCancel?.()
  }

  // Finalize and Send
  const handleSend = async () => {
    let finalData = recordedData
    if (isRecording) {
      finalData = await stopRecordingInternal()
    }

    if (!finalData) return

    setIsUploading(true)
    try {
      let publicUrl: string | undefined

      // Attempt Supabase storage upload if user is authenticated
      if (user?.uid) {
        try {
          const file = new File(
            [finalData.blob],
            `voice-${Date.now()}.webm`,
            { type: finalData.blob.type }
          )
          publicUrl = await uploadMedia(file, user.uid, 'voice')
        } catch (uploadErr) {
          console.warn('[VoiceNoteRecorder] uploadMedia failed, sending raw blob:', uploadErr)
        }
      }

      const sendFn = onSendVoiceNote || onSend
      if (sendFn) {
        await sendFn(
          finalData.blob,
          finalData.waveformData,
          finalData.durationSecs,
          publicUrl
        )
      }

      setRecordedData(null)
      setDuration(0)
    } catch (err) {
      console.error('[VoiceNoteRecorder] send error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  // Toggle preview playback
  const togglePreviewPlay = () => {
    if (!recordedData) return

    if (!previewAudioRef.current) {
      const audio = new Audio(recordedData.url)
      previewAudioRef.current = audio

      audio.ontimeupdate = () => setPreviewTime(audio.currentTime)
      audio.onended = () => {
        setIsPreviewPlaying(false)
        setPreviewTime(0)
      }
    }

    if (isPreviewPlaying) {
      previewAudioRef.current.pause()
      setIsPreviewPlaying(false)
    } else {
      previewAudioRef.current.play().catch(() => {})
      setIsPreviewPlaying(true)
    }
  }

  // Permission error message
  if (permissionDenied) {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-800', className)}>
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span className="flex-1">Microphone access denied. Please allow permissions in your browser.</span>
        <button
          onClick={() => setPermissionDenied(false)}
          className="text-xs font-semibold underline hover:opacity-80"
        >
          Dismiss
        </button>
      </div>
    )
  }

  // 1. Preview mode (recording finished, listening back before sending)
  if (recordedData) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 px-3 py-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 rounded-2xl w-full select-none animate-in fade-in duration-200',
          className
        )}
      >
        <button
          type="button"
          onClick={togglePreviewPlay}
          className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs"
        >
          {isPreviewPlaying ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Waveform representation */}
        <div className="flex-1 flex items-center gap-1 h-5">
          {liveAmplitudes.map((amp, idx) => (
            <div
              key={idx}
              style={{ height: `${Math.max(20, amp)}%` }}
              className="flex-1 bg-blue-400 dark:bg-blue-500 rounded-full min-w-[2px] transition-all"
            />
          ))}
        </div>

        <span className="font-mono text-xs text-blue-900 dark:text-blue-200 font-medium shrink-0">
          {formatDuration(isPreviewPlaying ? previewTime : recordedData.durationSecs)}
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 rounded-full text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Discard recording"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={isUploading}
            className="h-8 px-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>Send</span>
          </button>
        </div>
      </div>
    )
  }

  // 2. Active recording mode
  if (isRecording) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-2xl w-full select-none animate-in fade-in duration-200',
          className
        )}
      >
        {/* Pulsing red record indicator */}
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
          </div>
          <span className="font-mono text-xs font-semibold text-red-600 dark:text-red-400">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Real-time fluctuating amplitude visualizer */}
        <div className="flex-1 flex items-center gap-0.5 h-6 px-2">
          {liveAmplitudes.map((amp, idx) => (
            <div
              key={idx}
              style={{ height: `${amp}%` }}
              className="flex-1 bg-red-500 dark:bg-red-400 rounded-full min-w-[2px] transition-all duration-75"
            />
          ))}
        </div>

        {/* Stop / Cancel / Send buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 rounded-full text-zinc-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            title="Cancel recording"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={stopRecordingAndPreview}
            className="p-1.5 rounded-full text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            title="Stop & review"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={isUploading}
            className="h-8 w-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xs transition-all"
            title="Send voice note"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    )
  }

  // 3. Idle trigger button
  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      className={cn(
        'p-2 rounded-full text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        className
      )}
      title="Record voice note"
      aria-label="Record voice note"
    >
      <Mic className="h-5 w-5" />
    </button>
  )
}

export default VoiceNoteRecorder
