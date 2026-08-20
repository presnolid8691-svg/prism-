'use client'

import { useState } from 'react'
import { Message } from '@/types/message'
import { Button } from '@/components/ui/button'
import { Send, X } from 'lucide-react'

interface MessageInputProps {
  chatId: string
  replyTo?: Message | null
  onCancelReply?: () => void
  onSend: (content: string, type: Message['type'], extras?: Partial<Message>) => void
}

export function MessageInput({ chatId, replyTo, onCancelReply, onSend }: MessageInputProps) {
  const [text, setText] = useState('')

  const handleSend = () => {
    if (!text.trim()) return
    onSend(text.trim(), 'text')
    setText('')
  }

  return (
    <div className="flex flex-col border-t border-zinc-200 dark:border-zinc-800 p-2">
      {replyTo && (
        <div className="flex items-center justify-between bg-zinc-100 p-2 rounded mb-2">
          <div className="text-sm truncate text-zinc-600">Replying to: {replyTo.content}</div>
          <Button variant="ghost" size="icon" className="h-4 w-4" onClick={onCancelReply}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSend()
            }
          }}
        />
        <Button onClick={handleSend}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
