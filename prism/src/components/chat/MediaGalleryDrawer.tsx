'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Message } from '@/types/message'
import { formatMessageTime, formatFileSize } from '@/lib/utils/formatTime'
import {
  X,
  Image as ImageIcon,
  FileText,
  Mic,
  Link2,
  Download,
  ExternalLink,
  Play,
  Pause,
  Loader2,
  Sparkles,
  Maximize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils/cn'

interface MediaGalleryDrawerProps {
  chatId: string
  open: boolean
  onClose: () => void
}

type TabType = 'media' | 'docs' | 'voice' | 'links'

export function MediaGalleryDrawer({
  chatId,
  open,
  onClose,
}: MediaGalleryDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('media')
  const [selectedMedia, setSelectedMedia] = useState<Message | null>(null)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  // Listen to messages
  useEffect(() => {
    if (!open || !chatId) return

    setLoading(true)
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('sentAt', 'desc')
    )

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Message[]
        setMessages(msgs)
        setLoading(false)
      },
      (err) => {
        console.error('[MediaGalleryDrawer] Error fetching messages:', err)
        setLoading(false)
      }
    )

    return () => unsub()
  }, [chatId, open])

  // Stop audio on unmount or tab switch
  useEffect(() => {
    if (audioElement) {
      audioElement.pause()
      setAudioElement(null)
      setPlayingVoiceId(null)
    }
  }, [activeTab, open])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedMedia) {
          setSelectedMedia(null)
        } else if (open) {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, selectedMedia])

  // Categorize messages
  const mediaItems = useMemo(
    () =>
      messages.filter(
        (m) =>
          !m.deletedAt &&
          (m.type === 'image' || m.type === 'video' || m.type === 'gif') &&
          (m.mediaURL || m.gifURL)
      ),
    [messages]
  )

  const docItems = useMemo(
    () => messages.filter((m) => !m.deletedAt && m.type === 'file' && m.mediaURL),
    [messages]
  )

  const voiceItems = useMemo(
    () => messages.filter((m) => !m.deletedAt && m.type === 'voice' && m.mediaURL),
    [messages]
  )

  const linkItems = useMemo(
    () =>
      messages.filter(
        (m) =>
          !m.deletedAt &&
          (m.linkPreview ||
            (m.content && /https?:\/\/[^\s]+/.test(m.content)))
      ),
    [messages]
  )

  const handleToggleVoice = (msg: Message) => {
    if (!msg.mediaURL) return

    if (playingVoiceId === msg.id && audioElement) {
      audioElement.pause()
      setPlayingVoiceId(null)
      setAudioElement(null)
      return
    }

    if (audioElement) {
      audioElement.pause()
    }

    const audio = new Audio(msg.mediaURL)
    audio.play()
    setAudioElement(audio)
    setPlayingVoiceId(msg.id)

    audio.onended = () => {
      setPlayingVoiceId(null)
      setAudioElement(null)
    }
    audio.onerror = () => {
      setPlayingVoiceId(null)
      setAudioElement(null)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
              Shared Media &amp; Docs
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Files and links shared in this conversation
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 p-1.5 mx-4 my-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={cn(
              'py-1.5 rounded-lg transition-all flex items-center justify-center gap-1',
              activeTab === 'media'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-semibold'
                : 'hover:text-zinc-900 dark:hover:text-zinc-200'
            )}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Media ({mediaItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={cn(
              'py-1.5 rounded-lg transition-all flex items-center justify-center gap-1',
              activeTab === 'docs'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-semibold'
                : 'hover:text-zinc-900 dark:hover:text-zinc-200'
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Files ({docItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={cn(
              'py-1.5 rounded-lg transition-all flex items-center justify-center gap-1',
              activeTab === 'voice'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-semibold'
                : 'hover:text-zinc-900 dark:hover:text-zinc-200'
            )}
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Voice ({voiceItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={cn(
              'py-1.5 rounded-lg transition-all flex items-center justify-center gap-1',
              activeTab === 'links'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs font-semibold'
                : 'hover:text-zinc-900 dark:hover:text-zinc-200'
            )}
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Links ({linkItems.length})</span>
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-4 pb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
              <span className="text-xs">Loading media gallery...</span>
            </div>
          ) : activeTab === 'media' ? (
            mediaItems.length === 0 ? (
              <div className="py-20 text-center text-zinc-400">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No photos, videos, or GIFs yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {mediaItems.map((item) => {
                  const url = item.type === 'gif' ? item.gifURL : item.mediaURL
                  const isVideo = item.type === 'video'

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedMedia(item)}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer shadow-xs"
                    >
                      {isVideo ? (
                        <video
                          src={url || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={url || ''}
                          alt="Gallery item"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      )}

                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="h-5 w-5 drop-shadow" />
                      </div>

                      {isVideo && (
                        <div className="absolute bottom-1.5 left-1.5 p-1 rounded-md bg-black/60 text-white">
                          <Play className="h-3 w-3 fill-white" />
                        </div>
                      )}

                      {item.type === 'gif' && (
                        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-pink-300 uppercase">
                          GIF
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          ) : activeTab === 'docs' ? (
            docItems.length === 0 ? (
              <div className="py-20 text-center text-zinc-400">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No files or documents shared</p>
              </div>
            ) : (
              <div className="space-y-2">
                {docItems.map((docItem) => (
                  <div
                    key={docItem.id}
                    className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {docItem.content || 'Document'}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {docItem.mediaMeta?.sizeBytes
                          ? formatFileSize(docItem.mediaMeta.sizeBytes)
                          : 'File'}{' '}
                        • {formatMessageTime(docItem.sentAt)}
                      </p>
                    </div>

                    <a
                      href={docItem.mediaURL ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="p-2 rounded-lg text-zinc-500 hover:text-blue-600 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'voice' ? (
            voiceItems.length === 0 ? (
              <div className="py-20 text-center text-zinc-400">
                <Mic className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No voice notes recorded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {voiceItems.map((vItem) => {
                  const isPlaying = playingVoiceId === vItem.id
                  const duration = vItem.mediaMeta?.durationSecs
                    ? `${Math.floor(vItem.mediaMeta.durationSecs / 60)}:${String(
                        Math.floor(vItem.mediaMeta.durationSecs % 60)
                      ).padStart(2, '0')}`
                    : '0:00'

                  return (
                    <div
                      key={vItem.id}
                      className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleVoice(vItem)}
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm transition-transform active:scale-95',
                          isPlaying
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        )}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4 fill-white" />
                        ) : (
                          <Play className="h-4 w-4 fill-white ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          Voice Message ({duration})
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {formatMessageTime(vItem.sentAt)}
                        </p>
                      </div>

                      <a
                        href={vItem.mediaURL ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        download="voice-note.webm"
                        className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                        title="Download audio"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            linkItems.length === 0 ? (
              <div className="py-20 text-center text-zinc-400">
                <Link2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No links found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {linkItems.map((lItem) => {
                  const preview = lItem.linkPreview
                  const extractedUrl =
                    preview?.url ||
                    lItem.content.match(/https?:\/\/[^\s]+/)?.[0] ||
                    '#'

                  return (
                    <a
                      key={lItem.id}
                      href={extractedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {preview?.imageURL ? (
                        <img
                          src={preview.imageURL}
                          alt="Link preview"
                          className="w-12 h-12 rounded-lg object-cover bg-zinc-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Link2 className="h-5 w-5" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {preview?.title || extractedUrl}
                        </p>
                        {preview?.description && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                            {preview.description}
                          </p>
                        )}
                        <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                          <span className="truncate">{extractedUrl}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </p>
                      </div>
                    </a>
                  )
                })}
              </div>
            )
          )}
        </ScrollArea>
      </div>

      {/* Media Lightbox / Full View Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedMedia.type === 'video' ? (
              <video
                src={selectedMedia.mediaURL ?? ''}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl"
              />
            ) : (
              <img
                src={
                  (selectedMedia.type === 'gif'
                    ? selectedMedia.gifURL
                    : selectedMedia.mediaURL) ?? ''
                }
                alt="Full media"
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              />
            )}

            <div className="flex items-center gap-2 mt-3">
              <a
                href={
                  (selectedMedia.type === 'gif'
                    ? selectedMedia.gifURL
                    : selectedMedia.mediaURL) ?? '#'
                }
                target="_blank"
                rel="noopener noreferrer"
                download
                className="px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-sm flex items-center gap-1.5 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download Original
              </a>

              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-medium backdrop-blur-sm flex items-center gap-1.5 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
