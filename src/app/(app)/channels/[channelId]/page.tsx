'use client'

import { use } from 'react'
import { ChannelView } from '@/components/channels/ChannelView'

interface Props {
  params: Promise<{ channelId: string }>
}

export default function ChannelPage({ params }: Props) {
  const { channelId } = use(params)
  return <ChannelView channelId={channelId} />
}