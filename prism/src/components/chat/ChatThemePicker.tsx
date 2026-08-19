'use client'

import React, { useState, useEffect, useRef } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { uploadMedia } from '@/lib/supabase/storage'
import {
  X,
  Palette,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Loader2,
  Upload,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'

interface ChatThemePickerProps {
  chatId: string
  onClose: () => void
}

const PRESET_WALLPAPERS = [
  {
    id: 'none',
    name: 'Default Clean',
    value: null,
    preview: 'bg-zinc-100 dark:bg-zinc-800',
  },
  {
    id: 'slate-gradient',
    name: 'Slate Night',
    value: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    preview: 'bg-gradient-to-br from-slate-900 via-zinc-900 to-zinc-950',
  },
  {
    id: 'cosmic-purple',
    name: 'Cosmic Haze',
    value: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=800&auto=format&fit=crop&q=80',
    preview: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900',
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Sky',
    value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    preview: 'bg-gradient-to-br from-amber-200 via-rose-300 to-purple-400',
  },
  {
    id: 'aurora-green',
    name: 'Northern Lights',
    value: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?w=800&auto=format&fit=crop&q=80',
    preview: 'bg-gradient-to-br from-teal-800 via-emerald-900 to-cyan-950',
  },
  {
    id: 'pastel-minimal',
    name: 'Pastel Dream',
    value: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=80',
    preview: 'bg-gradient-to-br from-blue-100 via-indigo-100 to-rose-100',
  },
  {
    id: 'dark-mesh',
    name: 'Cyber Mesh',
    value: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80',
    preview: 'bg-gradient-to-br from-neutral-900 via-stone-900 to-black',
  },
]

const ACCENT_THEMES = [
  { id: 'blue', name: 'Prism Blue', color: '#2563eb', bgClass: 'bg-blue-600' },
  { id: 'emerald', name: 'Emerald', color: '#059669', bgClass: 'bg-emerald-600' },
  { id: 'purple', name: 'Violet', color: '#7c3aed', bgClass: 'bg-purple-600' },
  { id: 'rose', name: 'Rose', color: '#e11d48', bgClass: 'bg-rose-600' },
  { id: 'amber', name: 'Amber', color: '#d97706', bgClass: 'bg-amber-600' },
  { id: 'cyan', name: 'Ocean Cyan', color: '#0891b2', bgClass: 'bg-cyan-600' },
]

export function ChatThemePicker({ chatId, onClose }: ChatThemePickerProps) {
  const { user } = useAuthStore()
  const [selectedWallpaper, setSelectedWallpaper] = useState<string | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<string | null>('blue')
  const [customUrl, setCustomUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load current chat theme settings
  useEffect(() => {
    let cancelled = false
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'chats', chatId))
        if (snap.exists() && !cancelled) {
          const data = snap.data()
          setSelectedWallpaper(data.wallpaperURL || null)
          setSelectedTheme(data.theme || 'blue')
        }
      } catch (err) {
        console.error('[ChatThemePicker] Error loading theme:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchSettings()
    return () => {
      cancelled = true
    }
  }, [chatId])

  // Esc key close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.uid) return

    setUploading(true)
    try {
      const publicUrl = await uploadMedia(file, user.uid, 'wallpaper')
      setSelectedWallpaper(publicUrl)
    } catch (err) {
      console.error('[ChatThemePicker] Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        wallpaperURL: selectedWallpaper,
        theme: selectedTheme,
      })
      onClose()
    } catch (err) {
      console.error('[ChatThemePicker] Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSelectedWallpaper(null)
    setSelectedTheme('blue')
    setCustomUrl('')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
                Chat Theme &amp; Wallpaper
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Personalize this conversation
              </p>
            </div>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
              <p className="text-xs">Loading theme settings...</p>
            </div>
          ) : (
            <>
              {/* Preview Window */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  Live Preview
                </label>
                <div
                  className="w-full h-36 rounded-xl border border-zinc-200 dark:border-zinc-700 p-3 flex flex-col justify-end gap-2 overflow-hidden relative shadow-inner"
                  style={
                    selectedWallpaper
                      ? {
                          backgroundImage: `url(${selectedWallpaper})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : { backgroundColor: '#f4f4f5' }
                  }
                >
                  <div className="self-start max-w-[70%] bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-2xl rounded-tl-sm px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 shadow-xs">
                    Hey there! How does this wallpaper look? ✨
                  </div>
                  <div className="self-end max-w-[70%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-3 py-1.5 text-xs shadow-xs">
                    Looks fantastic! Let&apos;s apply it. 🚀
                  </div>
                </div>
              </div>

              {/* Accent Color Theme */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2.5 block">
                  Accent Color
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {ACCENT_THEMES.map((th) => {
                    const isSelected = selectedTheme === th.id
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setSelectedTheme(th.id)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-xs font-medium',
                          isSelected
                            ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800/80 shadow-xs'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                        )}
                      >
                        <span
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-white shadow-xs',
                            th.bgClass
                          )}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </span>
                        <span className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                          {th.name.split(' ')[0]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Wallpaper Presets */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2.5 block">
                  Preset Wallpapers
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {PRESET_WALLPAPERS.map((preset) => {
                    const isSelected = selectedWallpaper === preset.value
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedWallpaper(preset.value)}
                        className={cn(
                          'group relative rounded-xl overflow-hidden aspect-[4/3] border-2 transition-all p-0.5',
                          isSelected
                            ? 'border-blue-600 shadow-md'
                            : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                        )}
                      >
                        <div
                          className={cn(
                            'w-full h-full rounded-lg overflow-hidden flex items-end p-2 relative',
                            preset.preview
                          )}
                          style={
                            preset.value
                              ? {
                                  backgroundImage: `url(${preset.value})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                }
                              : {}
                          }
                        >
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                          <span className="relative z-10 text-[11px] font-medium text-white truncate drop-shadow">
                            {preset.name}
                          </span>
                          {isSelected && (
                            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center z-10 shadow-md">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Image / Upload */}
              <div className="space-y-3 pt-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                  Custom Wallpaper
                </label>

                <div className="flex gap-2">
                  <Input
                    placeholder="Paste image URL (https://...)"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="text-xs h-9 bg-zinc-50 dark:bg-zinc-800/60"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!customUrl.trim()}
                    onClick={() => {
                      if (customUrl.trim()) {
                        setSelectedWallpaper(customUrl.trim())
                      }
                    }}
                    className="text-xs shrink-0"
                  >
                    Apply URL
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-xs text-zinc-600 dark:text-zinc-300 flex items-center justify-center gap-2 h-9 border-dashed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Uploading Image...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        Upload Image from Device
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Default
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving || loading}
              onClick={handleSave}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white min-w-[80px]"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
