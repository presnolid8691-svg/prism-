'use client'

import { use } from 'react'
import { ProfilePage } from '@/components/profile/ProfilePage'

interface Props {
  params: Promise<{ userId: string }>
}

export default function UserProfilePage({ params }: Props) {
  const { userId } = use(params)
  return <ProfilePage userId={userId} />
}