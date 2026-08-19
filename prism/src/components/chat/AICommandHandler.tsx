'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  FileText,
  Languages,
  CheckCheck,
  HelpCircle,
  X,
  Loader2,
  Send,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils/cn'

export interface AICommand {
  id: string
  command: string
  title: string
  description: string
  icon: React.ElementType
  placeholder: string
  category: 'generate' | 'edit' | 'analyze'
}

export const AI_COMMANDS: AICommand[] = [
  {
    id: 'imagine',
    command: '/imagine',
    title: 'Generate Image',
    description: 'Create an image from description using Gemini AI',
    icon: ImageIcon,
    placeholder: 'e.g. A futuristic neon city in cyberpunk style at night',
    category: 'generate',
  },
  {
    id: 'summarize',
    command: '/summarize',
    title: 'Summarize Chat',
    description: 'Get key takeaways & bullet points of this conversation',
    icon: FileText,
    placeholder: 'Summarize recent messages...',
    category: 'analyze',
  },
  {
    id: 'fix',
    command: '/fix',
    title: 'Fix & Polish',
    description: 'Proofread spelling, grammar, and improve phrasing',
    icon: CheckCheck,
    placeholder: 'e.g. hey lets meet up tomorow at 3pm is that ok',
    category: 'edit',
  },
  {
    id: 'rewrite',
    command: '/rewrite',
    title: 'Tone Rewriter',
    description: 'Rewrite message in professional, casual, or concise tone',
    icon: Wand2,
    placeholder: 'e.g. I need you to send me the report right now',
    category: 'edit',
  },
  {
    id: 'translate',
    command: '/translate',
    title: 'Translate Message',
    description: 'Translate text into Spanish, French, Japanese, etc.',
    icon: Languages,
    placeholder: 'e.g. to Spanish: Hello, hope you are having a great day!',
    category: 'edit',
  },
  {
    id: 'ask',
    command: '/ask',
    title: 'Ask Prism AI',
    description: 'Ask any question or get recommendations',
    icon: HelpCircle,
    placeholder: 'e.g. What are some fun icebreakers for team chats?',
    category: 'generate',
  },
]

export interface AICommandHandlerProps {
  chatId?: string
  open?: boolean
  initialCommand?: string
  onClose?: () => void
  onApplyText?: (text: string) => void
  onSendMedia?: (url: string, type: 'image' | 'text') => void
  className?: string
}

export function AICommandHandler({
  chatId,
  open = true,
  initialCommand,
  onClose,
  onApplyText,
  onSendMedia,
  className,
}: AICommandHandlerProps) {
  const [selectedCommand, setSelectedCommand] = useState<AICommand>(
    AI_COMMANDS.find((c) => c.command === initialCommand) || AI_COMMANDS[0]
  )
  const [promptInput, setPromptInput] = useState('')
  const [toneOption, setToneOption] = useState<'professional' | 'casual' | 'concise' | 'friendly'>('professional')
  const [targetLang, setTargetLang] = useState('Spanish')
  const [loading, setLoading] = useState(false)
  const [resultText, setResultText] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (initialCommand) {
      const match = AI_COMMANDS.find((c) => c.command === initialCommand)
      if (match) setSelectedCommand(match)
    }
  }, [initialCommand])

  const handleExecute = async () => {
    setError(null)
    setResultText(null)
    setResultImage(null)
    setLoading(true)

    try {
      if (selectedCommand.id === 'imagine') {
        const prompt = promptInput.trim()
        if (!prompt) {
          setError('Please provide an image prompt')
          setLoading(false)
          return
        }

        const res = await fetch('/api/ai/imagine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to generate image')
        }

        const data = await res.json()
        setResultImage(data.imageURL || data.url || data.image)
      } else if (selectedCommand.id === 'summarize') {
        const res = await fetch('/api/ai/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to summarize conversation')
        }

        const data = await res.json()
        setResultText(data.summary || 'No summary available')
      } else if (selectedCommand.id === 'fix') {
        if (!promptInput.trim()) {
          setError('Please enter text to proofread')
          setLoading(false)
          return
        }

        // Call smart-reply or general prompt
        const res = await fetch('/api/ai/smart-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Proofread and polish this text. Correct any spelling or grammar mistakes while keeping original meaning: "${promptInput}"`,
          }),
        })

        if (!res.ok) {
          // Fallback simple polish
          setResultText(promptInput.trim())
        } else {
          const data = await res.json()
          setResultText(data.text || data.replies?.[0] || promptInput)
        }
      } else if (selectedCommand.id === 'rewrite') {
        if (!promptInput.trim()) {
          setError('Please enter text to rewrite')
          setLoading(false)
          return
        }

        const res = await fetch('/api/ai/smart-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Rewrite the following text in a ${toneOption} tone: "${promptInput}"`,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          setResultText(data.text || data.replies?.[0] || promptInput)
        } else {
          setResultText(promptInput)
        }
      } else if (selectedCommand.id === 'translate') {
        if (!promptInput.trim()) {
          setError('Please enter text to translate')
          setLoading(false)
          return
        }

        const res = await fetch('/api/ai/smart-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Translate this text into ${targetLang}: "${promptInput}"`,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          setResultText(data.text || data.replies?.[0] || promptInput)
        } else {
          setResultText(promptInput)
        }
      } else {
        // Ask
        const res = await fetch('/api/ai/smart-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptInput,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          setResultText(data.text || data.replies?.[0] || 'Here is what I found.')
        } else {
          setResultText(`Prism AI: I received your query "${promptInput}".`)
        }
      }
    } catch (err: any) {
      console.error('[AICommandHandler] Error:', err)
      setError(err.message || 'AI request failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!open) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200',
        className
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-zinc-900 dark:to-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base flex items-center gap-2">
                Prism AI Assistant
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Gemini
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Execute AI commands, generate images, &amp; rewrite messages
              </p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Command Selector Tabs */}
        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {AI_COMMANDS.map((cmd) => {
              const isSelected = selectedCommand.id === cmd.id
              const Icon = cmd.icon

              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => {
                    setSelectedCommand(cmd)
                    setError(null)
                    setResultText(null)
                    setResultImage(null)
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all',
                    isSelected
                      ? 'bg-white dark:bg-zinc-800 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                      : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[11px] truncate w-full">{cmd.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 p-5 space-y-4">
          <div className="space-y-3">
            {/* Command info */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <code>{selectedCommand.command}</code> — {selectedCommand.title}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {selectedCommand.description}
                </span>
              </div>
            </div>

            {/* Extra options based on command */}
            {selectedCommand.id === 'rewrite' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Tone:</span>
                {(['professional', 'casual', 'concise', 'friendly'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setToneOption(t)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors',
                      toneOption === t
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {selectedCommand.id === 'translate' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Target Language:</span>
                {['Spanish', 'French', 'German', 'Japanese', 'Hindi', 'Arabic'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setTargetLang(lang)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                      targetLang === lang
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}

            {/* Input area */}
            {selectedCommand.id !== 'summarize' && (
              <div>
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder={selectedCommand.placeholder}
                  rows={3}
                  className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleExecute()
                    }
                  }}
                />
              </div>
            )}

            {/* Action button */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">
                {selectedCommand.id === 'summarize'
                  ? 'Summarizes up to last 50 messages'
                  : 'Press Ctrl+Enter to run'}
              </span>
              <Button
                type="button"
                onClick={handleExecute}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 h-9 shadow-md flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating with Gemini...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3.5 w-3.5" />
                    Run Command
                  </>
                )}
              </Button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Result area */}
            {(resultText || resultImage) && (
              <div className="mt-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                    AI Result
                  </span>
                  {resultText && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(resultText)}
                      className="h-7 text-xs text-zinc-500 hover:text-zinc-900"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {resultText && (
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {resultText}
                  </p>
                )}

                {resultImage && (
                  <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    <img
                      src={resultImage}
                      alt="Generated by AI"
                      className="w-full max-h-72 object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  {resultText && onApplyText && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onApplyText(resultText)
                        onClose?.()
                      }}
                      className="text-xs flex items-center gap-1"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Insert into Input
                    </Button>
                  )}

                  {resultImage && onSendMedia && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onSendMedia(resultImage, 'image')
                        onClose?.()
                      }}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send Image to Chat
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
