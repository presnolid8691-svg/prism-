'use client'

import { use } from 'react'
import { StoryViewer } from '@/components/stories/StoryViewer'

interface Props {
  params: Promise<{ userId: string }>
}

export default function StoryPage({ params }: Props) {
  const { userId } = use(params)
  return <StoryViewer userId={userId} />
}