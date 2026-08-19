'use client'
import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ChannelView({ channelId }: { channelId?: string }) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Channel {channelId ? '#' + channelId : ''}</h2>
        <p className="text-sm text-zinc-500">Public broadcasting channel</p>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          <div className="text-center text-sm text-zinc-500 my-4">Welcome to the channel!</div>
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
        <Input placeholder="Broadcast a message..." className="flex-1" />
        <Button>Send</Button>
      </div>
    </div>
  )
}
