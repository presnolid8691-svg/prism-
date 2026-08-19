'use client'

import { ProfilePage } from '@/components/profile/ProfilePage'
import { useAuthStore } from '@/store/authStore'

export default function MyProfilePage() {
  const { uid } = useAuthStore()

  if (!uid) return null

  return <ProfilePage userId={uid} />
}