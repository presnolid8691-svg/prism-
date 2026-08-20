'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Message } from '@/types/message'
import { Sparkles, RotateCw, X, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface SmartRepliesProps {
  /** Array of recent messages in the conversation */
  messages?: Message[]
  /** Last incoming message content or object */
  lastMessage?: string | Message
  /** Direct suggested replies array */
  replies?: string[]
  /** Called when a reply suggestion is clicked */
  onSelectReply: (reply: string) => void
  /** Loading indicator */
  isLoading?: boolean
  /** Callback to regenerate replies */
  onRefresh?: () => void
  /** Callback to dismiss replies */
  onDismiss?: () => void
  /** Custom Tailwind classes */
  className?: string
  /** Compact styling */
  compact?: boolean
}

/** Generates contextual quick reply suggestions based on the last message */
function generateContextualReplies(lastText: string): string[] {
  const text = lastText.trim().toLowerCase()
  if (!text) {
    return ['Sounds good! 👍', 'Got it!', 'Thanks! 🙏']
  }

  // Greetings
  if (/^(hi|hello|hey|good morning|good evening|good afternoon|what's up|yo)\b/i.test(text)) {
    return ['Hey there! 👋', 'Hello! How are you doing?', 'Good to hear from you!']
  }

  // Questions
  if (text.includes('?')) {
    if (/when|what time|where/i.test(text)) {
      return ['Let me check and get back to you', 'Around 3:00 PM works for me', 'Any time works!']
    }
    if (/can you|could you|are you able/i.test(text)) {
      return ['Yes, absolutely!', 'I will take care of it', 'Let me check on that']
    }
    if (/how are you|how is it going/i.test(text)) {
      return ["I'm doing well, thanks! 😊", 'Pretty good, how about you?', 'All great here!']
    }
    return ['Yes, definitely! 👍', 'No problem at all', 'Let me check']
  }

  // Gratitude
  if (/thank|thanks|thx|appreciate/i.test(text)) {
    return ["You're welcome! 😊", 'Anytime! Happy to help', 'Glad I could help!']
  }

  // Agreements / Confirmations
  if (/done|finished|sent|ready|ok|okay/i.test(text)) {
    return ['Awesome, thank you! 🙌', 'Great! Looking at it now', 'Perfect 👍']
  }

  // Apologies
  if (/sorry|apologize|my bad/i.test(text)) {
    return ['No worries at all! 😊', 'All good 👍', "Don't sweat it!"]
  }

  // Default fallback pool
  return ['Sounds good to me! 👍', 'Got it, thank you!', "I'm on it 🚀"]
}

/**
 * AI-powered smart quick reply suggestions bar above the chat input.
 */
export function SmartReplies({
  messages,
  lastMessage,
  replies: directReplies,
  onSelectReply,
  isLoading = false,
  onRefresh,
  onDismiss,
  className,
  compact = false,
}: SmartRepliesProps) {
  const [dismissed, setDismissed] = useState(false)
  const [cycleIndex, setCycleIndex] = useState(0)

  // Extract last message text
  const lastMsgText = useMemo(() => {
    if (typeof lastMessage === 'string') return lastMessage
    if (lastMessage && 'content' in lastMessage) return lastMessage.content
    if (messages && messages.length > 0) {
      const last = messages[messages.length - 1]
      return last.content || ''
    }
    return ''
  }, [lastMessage, messages])

  // Reset dismissed state when last message changes
  useEffect(() => {
    setDismissed(false)
    setCycleIndex(0)
  }, [lastMsgText])

  const suggestedReplies = useMemo(() => {
    if (directReplies && directReplies.length > 0) {
      return directReplies
    }
    const defaultPool = generateContextualReplies(lastMsgText)
    return defaultPool
  }, [directReplies, lastMsgText])

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRefresh) {
      onRefresh()
    } else {
      setCycleIndex((prev) => prev + 1)
    }
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed || (!suggestedReplies.length && !isLoading)) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto no-scrollbar select-none animate-in fade-in slide-in-from-bottom-1 duration-200',
        compact ? 'py-1' : 'py-1.5',
        className
      )}
    >
      {/* AI Indicator badge */}
      <div
        className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-1 rounded-full shrink-0 border border-purple-200 dark:border-purple-800/40"
        title="AI Quick Replies"
      >
        <Sparkles className="h-3 w-3 animate-pulse text-purple-500" />
        <span className="hidden sm:inline">Suggestions</span>
      </div>

      {/* Suggested replies pills */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto no-scrollbar">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-zinc-400 italic px-2">
            <RotateCw className="h-3 w-3 animate-spin text-purple-500" />
            <span>Generating suggestions...</span>
          </div>
        ) : (
          suggestedReplies.map((reply, idx) => (
            <button
              key={`${reply}-${idx}-${cycleIndex}`}
              type="button"
              onClick={() => onSelectReply(reply)}
              className={cn(
                'group flex items-center gap-1 whitespace-nowrap rounded-full font-medium transition-all text-left shadow-2xs shrink-0',
                compact
                  ? 'px-2.5 py-0.5 text-xs'
                  : 'px-3 py-1 text-xs',
                'bg-white dark:bg-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-zinc-700 dark:text-zinc-200 hover:text-purple-700 dark:hover:text-purple-300 border border-zinc-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-800'
              )}
            >
              <span>{reply}</span>
              <ArrowUpRight className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500" />
            </button>
          ))
        )}
      </div>

      {/* Action buttons (Refresh & Dismiss) */}
      <div className="flex items-center gap-0.5 shrink-0 ml-1">
        <button
          type="button"
          onClick={handleRefresh}
          className="p-1 rounded-full text-zinc-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors"
          title="Refresh suggestions"
          aria-label="Refresh suggestions"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Dismiss suggestions"
          aria-label="Dismiss suggestions"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default SmartReplies
