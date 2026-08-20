'use client'

import { ChatList } from '@/components/chat/ChatList'
import { MessageSquare } from 'lucide-react'

export default function ChatsPage() {
  return (
    <div className="flex h-full w-full">
      {/* Chat list — full width on mobile, fixed width on desktop */}
      <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 border-r border-zinc-200 h-full overflow-hidden">
        <ChatList />
      </div>

      {/* Empty state center pane on desktop */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-zinc-50 h-full">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-800">Select a conversation</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Choose a chat from the list to start messaging
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}