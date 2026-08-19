'use client'

import { useEffect } from 'react'
import { use } from 'react'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { useChatStore } from '@/store/chatStore'

interface Props {
  params: Promise<{ chatId: string }>
}

export default function ChatPage({ params }: Props) {
  const { chatId } = use(params)
  const { setSelectedChatId } = useChatStore()

  useEffect(() => {
    setSelectedChatId(chatId)
    return () => setSelectedChatId(null)
  }, [chatId, setSelectedChatId])

  return <ChatWindow chatId={chatId} />
}