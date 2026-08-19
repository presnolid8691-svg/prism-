'use client'

import React, { useState, useRef, useCallback } from 'react'
import { UploadCloud, FileUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface FileDropZoneProps {
  children: React.ReactNode
  onFilesDropped: (files: File[]) => void
  disabled?: boolean
  className?: string
  accept?: string
}

export function FileDropZone({
  children,
  onFilesDropped,
  disabled = false,
  className,
  accept,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled) return

      dragCounter.current += 1
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true)
      }
    },
    [disabled]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled) return
      e.dataTransfer.dropEffect = 'copy'
    },
    [disabled]
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (disabled) return

      dragCounter.current -= 1
      if (dragCounter.current <= 0) {
        dragCounter.current = 0
        setIsDragging(false)
      }
    },
    [disabled]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      dragCounter.current = 0

      if (disabled) return

      const dt = e.dataTransfer
      if (dt.files && dt.files.length > 0) {
        let droppedFiles = Array.from(dt.files)

        if (accept) {
          const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase())
          droppedFiles = droppedFiles.filter((file) => {
            return acceptedTypes.some((type) => {
              if (type.endsWith('/*')) {
                const prefix = type.replace('/*', '')
                return file.type.startsWith(prefix)
              }
              return file.type === type || file.name.toLowerCase().endsWith(type)
            })
          })
        }

        if (droppedFiles.length > 0) {
          onFilesDropped(droppedFiles)
        }
      }
    },
    [disabled, accept, onFilesDropped]
  )

  return (
    <div
      className={cn('relative w-full h-full min-h-0', className)}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {/* Drag & drop overlay */}
      {isDragging && !disabled && (
        <div className="absolute inset-0 z-40 bg-blue-600/10 dark:bg-blue-500/15 backdrop-blur-xs border-2 border-dashed border-blue-500 dark:border-blue-400 rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-150 pointer-events-none select-none">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 animate-bounce">
            <UploadCloud className="h-8 w-8" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
            Drop files to share in chat
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 max-w-xs">
            Release to instantly attach photos, videos, audio, or documents
          </p>
        </div>
      )}
    </div>
  )
}
