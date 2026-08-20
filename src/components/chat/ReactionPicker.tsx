'use client'

import React, { useState, useMemo } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ReactionPickerProps {
  onEmojiSelect: (emoji: string) => void
  onClose?: () => void
  className?: string
}

const QUICK_REACTIONS = ['❤️', '👍', '😂', '🔥', '😮', '😢', '🎉', '🙏']

const EMOJI_CATEGORIES: { name: string; emojis: { emoji: string; keywords: string[] }[] }[] = [
  {
    name: 'Smileys',
    emojis: [
      { emoji: '😀', keywords: ['grinning', 'happy', 'smile'] },
      { emoji: '😂', keywords: ['joy', 'laugh', 'tears', 'funny'] },
      { emoji: '🤣', keywords: ['rofl', 'laughing', 'lol'] },
      { emoji: '😊', keywords: ['blush', 'warm', 'happy'] },
      { emoji: '😍', keywords: ['heart_eyes', 'love', 'crush'] },
      { emoji: '🥰', keywords: ['smiling_face_with_hearts', 'love'] },
      { emoji: '😎', keywords: ['sunglasses', 'cool'] },
      { emoji: '🤔', keywords: ['thinking', 'wonder', 'hmm'] },
      { emoji: '😮', keywords: ['open_mouth', 'surprised', 'wow'] },
      { emoji: '😭', keywords: ['sob', 'crying', 'sad'] },
      { emoji: '🥺', keywords: ['pleading', 'puppy_eyes', 'beg'] },
      { emoji: '🤯', keywords: ['exploding_head', 'mindblown'] },
      { emoji: '🥳', keywords: ['partying', 'celebrate'] },
      { emoji: '😴', keywords: ['sleeping', 'tired', 'zzz'] },
      { emoji: '😇', keywords: ['halo', 'angel', 'innocent'] },
      { emoji: '😈', keywords: ['devil', 'evil', 'naughty'] },
    ],
  },
  {
    name: 'Gestures',
    emojis: [
      { emoji: '👍', keywords: ['thumbsup', 'like', 'approve', 'yes'] },
      { emoji: '👎', keywords: ['thumbsdown', 'dislike', 'no'] },
      { emoji: '👏', keywords: ['clap', 'applause', 'bravo'] },
      { emoji: '🙌', keywords: ['raised_hands', 'hooray', 'praise'] },
      { emoji: '🙏', keywords: ['pray', 'thanks', 'please', 'grateful'] },
      { emoji: '✌️', keywords: ['peace', 'victory'] },
      { emoji: '🤞', keywords: ['fingers_crossed', 'luck', 'hope'] },
      { emoji: '🤝', keywords: ['handshake', 'deal', 'agreement'] },
      { emoji: '💪', keywords: ['muscle', 'strong', 'flex'] },
      { emoji: '👊', keywords: ['fist_bump', 'bro'] },
      { emoji: '👋', keywords: ['wave', 'hello', 'bye'] },
      { emoji: '🫡', keywords: ['salute', 'respect'] },
    ],
  },
  {
    name: 'Symbols & Hearts',
    emojis: [
      { emoji: '❤️', keywords: ['red_heart', 'love'] },
      { emoji: '💖', keywords: ['sparkling_heart', 'love'] },
      { emoji: '💔', keywords: ['broken_heart', 'sad'] },
      { emoji: '🔥', keywords: ['fire', 'lit', 'hot'] },
      { emoji: '✨', keywords: ['sparkles', 'magic', 'clean'] },
      { emoji: '💯', keywords: ['100', 'perfect', 'hundred'] },
      { emoji: '🎉', keywords: ['party_popper', 'tada', 'celebration'] },
      { emoji: '🚀', keywords: ['rocket', 'launch', 'fast'] },
      { emoji: '⭐', keywords: ['star', 'favorite'] },
      { emoji: '👀', keywords: ['eyes', 'look', 'watching'] },
      { emoji: '💡', keywords: ['idea', 'lightbulb'] },
      { emoji: '🎯', keywords: ['bullseye', 'target', 'goal'] },
    ],
  },
]

export function ReactionPicker({
  onEmojiSelect,
  onClose,
  className,
}: ReactionPickerProps) {
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return EMOJI_CATEGORIES

    return EMOJI_CATEGORIES.map((cat) => ({
      name: cat.name,
      emojis: cat.emojis.filter(
        (e) =>
          e.emoji.includes(term) ||
          e.keywords.some((k) => k.toLowerCase().includes(term))
      ),
    })).filter((cat) => cat.emojis.length > 0)
  }, [search])

  if (!expanded) {
    return (
      <div
        className={cn(
          'flex items-center gap-1 p-1 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 select-none animate-in fade-in zoom-in-95 duration-150',
          className
        )}
      >
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onEmojiSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center text-lg rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all duration-150 hover:scale-125 active:scale-95"
            title={emoji}
          >
            {emoji}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-7 h-7 ml-0.5 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
          title="More reactions"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'w-72 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden flex flex-col select-none animate-in fade-in zoom-in-95 duration-150',
        className
      )}
    >
      {/* Header & Search */}
      <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-700/80">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reaction..."
            autoFocus
            className="w-full pl-8 pr-7 py-1 text-xs bg-zinc-100 dark:bg-zinc-700/60 text-zinc-900 dark:text-zinc-100 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                setExpanded(false)
                onClose?.()
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Emoji list */}
      <div className="p-2 max-h-56 overflow-y-auto space-y-3">
        {filteredCategories.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-400">
            No emojis found
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.name}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1 mb-1">
                {cat.name}
              </div>
              <div className="grid grid-cols-6 gap-1">
                {cat.emojis.map(({ emoji, keywords }) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onEmojiSelect(emoji)}
                    className="h-8 flex items-center justify-center text-xl rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-all hover:scale-120 active:scale-90"
                    title={keywords[0]}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer quick back */}
      <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-700/60 flex items-center justify-between text-[11px] text-zinc-500">
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Quick bar
        </button>
        <span>Pick any reaction</span>
      </div>
    </div>
  )
}
