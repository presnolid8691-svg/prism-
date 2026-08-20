'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Play, Pause, Loader2, Volume2, AlertCircle } from 'lucide-react'
import { formatDuration } from '@/lib/utils/formatTime'
import { cn } from '@/lib/utils/cn'

export interface VoiceNotePlayerProps {
  /** Public URL of the audio file */
  audioURL: string
  /** Array of amplitude numbers representing audio waveform */
  waveformData?: number[] | null
  /** Stored duration in seconds */
  duration?: number
  /** Whether the message is sent by the current user (for theme colors) */
  isOwn?: boolean
  /** Custom classes */
  className?: string
  /** Auto play when mounted */
  autoPlay?: boolean
  /** Callbacks */
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}

const BAR_COUNT = 32

/** Normalizes raw waveform amplitude data into a fixed number of bar heights (15% to 100%) */
function generateWaveformBars(data?: number[] | null, count: number = BAR_COUNT): number[] {
  if (data && data.length > 0) {
    const step = data.length / count
    const maxVal = Math.max(...data, 1)
    const bars: number[] = []

    for (let i = 0; i < count; i++) {
      const start = Math.floor(i * step)
      const end = Math.min(Math.floor((i + 1) * step), data.length)
      const slice = data.slice(start, Math.max(start + 1, end))
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length
      // Scale between 20% and 100%
      const normalized = Math.max(0.2, Math.min(1.0, avg / maxVal))
      bars.push(Math.round(normalized * 100))
    }
    return bars
  }

  // Fallback procedural waveform shape
  const fallbackBars = [
    25, 40, 60, 35, 80, 95, 70, 45, 85, 100, 75, 55, 90, 65, 40, 70, 85, 60, 95,
    75, 40, 60, 80, 50, 90, 70, 45, 60, 35, 55, 40, 25,
  ]
  return fallbackBars.slice(0, count)
}

/**
 * VoiceNotePlayer with interactive waveform scrub, play/pause, playback speed multiplier, and timer.
 */
export function VoiceNotePlayer({
  audioURL,
  waveformData,
  duration: initialDuration = 0,
  isOwn = false,
  className,
  autoPlay = false,
  onPlay,
  onPause,
  onEnded,
}: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(initialDuration)
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const waveformContainerRef = useRef<HTMLDivElement | null>(null)

  const bars = useMemo(() => generateWaveformBars(waveformData, BAR_COUNT), [waveformData])

  // Sync duration if prop updates
  useEffect(() => {
    if (initialDuration > 0 && duration === 0) {
      setDuration(initialDuration)
    }
  }, [initialDuration, duration])

  // Setup audio element listeners
  useEffect(() => {
    if (!audioURL) {
      setHasError(true)
      return
    }

    const audio = new Audio(audioURL)
    audioRef.current = audio
    audio.preload = 'metadata'
    audio.playbackRate = playbackRate

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration))
      }
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      onEnded?.()
    }

    const handleWaiting = () => setIsLoading(true)
    const handlePlaying = () => {
      setIsLoading(false)
      setIsPlaying(true)
    }
    const handlePauseEvent = () => setIsPlaying(false)
    const handleError = () => {
      setIsLoading(false)
      setIsPlaying(false)
      setHasError(true)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('pause', handlePauseEvent)
    audio.addEventListener('error', handleError)

    if (autoPlay) {
      audio.play().catch(() => {})
    }

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('pause', handlePauseEvent)
      audio.removeEventListener('error', handleError)
      audio.src = ''
    }
  }, [audioURL, autoPlay, onEnded])

  // Play / Pause toggle
  const togglePlay = useCallback(async () => {
    if (!audioRef.current || hasError) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      onPause?.()
    } else {
      try {
        setIsLoading(true)
        await audioRef.current.play()
        setIsPlaying(true)
        onPlay?.()
      } catch (err) {
        console.error('[VoiceNotePlayer] play error:', err)
        setIsPlaying(false)
      } finally {
        setIsLoading(false)
      }
    }
  }, [isPlaying, hasError, onPlay, onPause])

  // Toggle speed
  const handleSpeedToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextRate: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1
    setPlaybackRate(nextRate)
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate
    }
  }

  // Seek on waveform click
  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformContainerRef.current || !audioRef.current || hasError) return
    const rect = waveformContainerRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, clickX / rect.width))
    const targetDuration = duration || audioRef.current.duration || 1
    const newTime = percent * targetDuration

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const effectiveDuration = duration > 0 ? duration : (audioRef.current?.duration || 0)
  const progressRatio = effectiveDuration > 0 ? Math.min(1, currentTime / effectiveDuration) : 0
  const activeBarIndex = Math.floor(progressRatio * bars.length)

  if (hasError) {
    return (
      <div className={cn('flex items-center gap-2 text-xs py-1 px-2 text-rose-500', className)}>
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Voice note unavailable</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 py-1 select-none min-w-[200px] max-w-[280px]',
        className
      )}
    >
      {/* Play / Pause / Loading Button */}
      <button
        type="button"
        onClick={togglePlay}
        disabled={isLoading}
        className={cn(
          'h-9 w-9 rounded-full flex items-center justify-center transition-all shrink-0 shadow-xs active:scale-95',
          isOwn
            ? 'bg-white text-blue-600 hover:bg-white/90'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        )}
        title={isPlaying ? 'Pause' : 'Play voice note'}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform and Meta Area */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        {/* Interactive Waveform Bar Container */}
        <div
          ref={waveformContainerRef}
          onClick={handleWaveformClick}
          className="flex items-center gap-0.5 h-6 cursor-pointer py-1 group/wave"
          title="Click to seek"
        >
          {bars.map((heightPercent, idx) => {
            const isPlayed = idx <= activeBarIndex
            return (
              <div
                key={idx}
                className="flex-1 flex items-center justify-center h-full"
              >
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={cn(
                    'w-full rounded-full transition-all duration-75 min-w-[2px]',
                    isPlayed
                      ? isOwn
                        ? 'bg-white'
                        : 'bg-blue-600 dark:bg-blue-400'
                      : isOwn
                      ? 'bg-white/35 group-hover/wave:bg-white/50'
                      : 'bg-zinc-300 dark:bg-zinc-600 group-hover/wave:bg-zinc-400'
                  )}
                />
              </div>
            )
          })}
        </div>

        {/* Time and Speed multiplier */}
        <div className="flex items-center justify-between text-[11px] leading-none">
          <span
            className={cn(
              'font-mono',
              isOwn ? 'text-blue-100' : 'text-zinc-500 dark:text-zinc-400'
            )}
          >
            {isPlaying ? formatDuration(currentTime) : formatDuration(effectiveDuration)}
          </span>

          <button
            type="button"
            onClick={handleSpeedToggle}
            className={cn(
              'font-semibold px-1 py-0.5 rounded text-[10px] transition-colors',
              isOwn
                ? 'bg-white/20 hover:bg-white/30 text-white'
                : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 text-zinc-700 dark:text-zinc-300'
            )}
            title="Change playback speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  )
}

export default VoiceNotePlayer
