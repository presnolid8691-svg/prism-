'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { uploadMedia } from '@/lib/supabase/storage'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ImagePlus, X, MapPin, Tag, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface CreatePostModalProps {
  open: boolean
  onClose: () => void
}

interface MediaPreview {
  file: File
  preview: string
  type: 'image' | 'video'
}

export function CreatePostModal({ open, onClose }: CreatePostModalProps) {
  const { uid } = useAuthStore()
  const [mediaFiles, setMediaFiles] = useState<MediaPreview[]>([])
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [posting, setPosting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const previews = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' as const : 'image' as const,
    }))
    setMediaFiles(prev => [...prev, ...previews].slice(0, 10))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024,
  })

  const removeMedia = (index: number) => {
    setMediaFiles(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '')
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag])
    }
    setTagInput('')
  }

  const handlePost = async () => {
    if (!uid || (mediaFiles.length === 0 && !caption.trim())) return
    setPosting(true)
    setError(null)
    try {
      const uploadedURLs: string[] = []
      const mediaMeta: Array<{ width: number; height: number; type: string }> = []

      for (let i = 0; i < mediaFiles.length; i++) {
        const { file, type } = mediaFiles[i]
        setUploadProgress(Math.round(((i + 0.5) / mediaFiles.length) * 100))
        const url = await uploadMedia(file, uid, type)
        uploadedURLs.push(url)
        mediaMeta.push({ width: 0, height: 0, type })
        setUploadProgress(Math.round(((i + 1) / mediaFiles.length) * 100))
      }

      await addDoc(collection(db, 'feed'), {
        authorId: uid,
        caption: caption.trim(),
        mediaURLs: uploadedURLs,
        mediaMeta,
        likeCount: 0,
        commentCount: 0,
        likedBy: [],
        tags,
        location: location.trim() || null,
        createdAt: serverTimestamp(),
        editedAt: null,
      })

      setMediaFiles([])
      setCaption('')
      setLocation('')
      setTags([])
      setUploadProgress(0)
      onClose()
    } catch (err) {
      setError('Failed to post. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  const handleClose = () => {
    if (!posting) {
      mediaFiles.forEach(m => URL.revokeObjectURL(m.preview))
      setMediaFiles([])
      setCaption('')
      setLocation('')
      setTags([])
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-lg w-full p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-zinc-100">
          <DialogTitle className="text-base font-semibold">Create Post</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="p-6 space-y-4">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50'
              )}
            >
              <input {...getInputProps()} />
              <ImagePlus className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-600">
                {isDragActive ? 'Drop files here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Images and videos, up to 10 files</p>
            </div>

            {/* Media previews */}
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {mediaFiles.map((media, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100">
                    {media.type === 'image' ? (
                      <Image src={media.preview} alt="" fill className="object-cover" />
                    ) : (
                      <video src={media.preview} className="w-full h-full object-cover" muted />
                    )}
                    <button
                      onClick={() => removeMedia(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Caption */}
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Write a caption…"
              rows={3}
              className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Tags */}
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ',') && addTag()}
                    placeholder="Add tags (press Enter)"
                    className="pl-9 border-zinc-200 focus-visible:ring-blue-500 text-sm"
                  />
                </div>
                <Button variant="outline" onClick={addTag} className="border-zinc-200 text-sm">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5"
                    >
                      #{tag}
                      <button onClick={() => setTags(t => t.filter(x => x !== tag))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Add location"
                className="pl-9 border-zinc-200 focus-visible:ring-blue-500 text-sm"
              />
            </div>

            {/* Upload progress */}
            {posting && uploadProgress > 0 && (
              <div>
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>Uploading…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 px-6 py-4 border-t border-zinc-100">
          <Button variant="outline" onClick={handleClose} disabled={posting} className="flex-1 border-zinc-200">
            Cancel
          </Button>
          <Button
            onClick={handlePost}
            disabled={posting || (mediaFiles.length === 0 && !caption.trim())}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {posting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting…
              </>
            ) : 'Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
