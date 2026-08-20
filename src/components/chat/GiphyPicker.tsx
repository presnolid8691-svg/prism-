'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useGiphy } from '@/hooks/useGiphy'
import { cn } from '@/lib/utils/cn'

interface GiphyPickerProps {
  onSelect: (
    gifUrl: string,
    gifMeta?: { id: string; title: string; width: number; height: number }
  ) => void
  onClose?: () => void
  className?: string
}

const POPULAR_TAGS = [
  'Trending',
  'Reactions',
  'Happy',
  'Sad',
  'Applause',
  'Dance',
  'Cat',
  'Confused',
  'Love',
  'OMG',
  'Yes',
  'No',
  'Facepalm',
  'Party',
]

export function GiphyPicker({ onSelect, onClose, className }: GiphyPickerProps) {
  const { gifs, isLoading, search, loadMore, query, setQuery } = useGiphy()
  const [selectedTag, setSelectedTag] = useState('Trending')
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag)
    if (tag === 'Trending') {
      setQuery('')
    } else {
      setQuery(tag)
      search(tag)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (!val) {
      setSelectedTag('Trending')
    } else {
      setSelectedTag('')
    }
  }

  return (
    <div
      className={cn(
        'w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in-95 duration-150',
        className
      )}
    >
      {/* Header */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <Sparkles className="h-4 w-4 text-pink-500" />
            <span>Search GIFs</span>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          <Input
            value={query}
            onChange={handleSearchChange}
            placeholder="Search all the GIFs..."
            className="pl-8 pr-7 h-8 text-xs bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-lg"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setSelectedTag('Trending')
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar text-[11px]">
          {POPULAR_TAGS.map((tag) => {
            const isSelected = selectedTag === tag
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={cn(
                  'px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors font-medium shrink-0',
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                )}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* GIFs Grid */}
      <ScrollArea className="h-72 p-2">
        {isLoading && gifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin text-pink-500 mb-2" />
            <p className="text-xs">Finding GIFs...</p>
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-center text-zinc-400 px-4">
            <AlertCircle className="h-6 w-6 mb-1 opacity-50" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              No GIFs found
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Try searching with different keywords
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => {
                const url =
                  gif.images.fixed_height?.url ||
                  gif.images.preview_gif?.url ||
                  gif.images.original?.url
                const width = parseInt(gif.images.fixed_height?.width || '200', 10)
                const height = parseInt(gif.images.fixed_height?.height || '150', 10)

                return (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => {
                      onSelect(url, {
                        id: gif.id,
                        title: gif.title,
                        width,
                        height,
                      })
                      onClose?.()
                    }}
                    className="group relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 hover:ring-2 hover:ring-pink-500 transition-all cursor-pointer"
                  >
                    <img
                      src={url}
                      alt={gif.title || 'GIF'}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                      <span className="text-[10px] text-white truncate drop-shadow">
                        {gif.title || 'GIF'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Load more button */}
            <div className="pt-2 pb-1 text-center">
              <Button
                variant="ghost"
                size="sm"
                disabled={isLoading}
                onClick={loadMore}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 h-7"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : null}
                Load more GIFs
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Footer Powered By GIPHY */}
      <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/80 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
        <span className="font-semibold uppercase tracking-wider text-pink-500">
          Powered by GIPHY
        </span>
        <span>Click to send</span>
      </div>
    </div>
  )
}
