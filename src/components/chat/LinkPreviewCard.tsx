'use client'

import React, { useState } from 'react'
import { LinkPreview } from '@/types/message'
import { ExternalLink, Globe } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface LinkPreviewCardProps {
  preview?: LinkPreview | null
  className?: string
}

function getHostName(urlStr: string): string {
  try {
    const parsed = new URL(urlStr)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return urlStr
  }
}

export function LinkPreviewCard({ preview, className }: LinkPreviewCardProps) {
  const [imageError, setImageError] = useState(false)

  if (!preview || (!preview.title && !preview.description && !preview.url)) {
    return null
  }

  const hostname = preview.siteName || getHostName(preview.url)
  const hasImage = !!preview.imageURL && !imageError

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group block rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 text-left shadow-xs',
        className
      )}
    >
      {/* Media Image */}
      {hasImage && (
        <div className="relative w-full h-32 bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <img
            src={preview.imageURL}
            alt={preview.title || 'Link preview'}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-2.5">
        <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
          <Globe className="h-3 w-3 shrink-0" />
          <span className="truncate">{hostname}</span>
          <ExternalLink className="h-2.5 w-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400" />
        </div>

        {preview.title && (
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {preview.title}
          </h4>
        )}

        {preview.description && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  )
}
