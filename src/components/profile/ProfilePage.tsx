'use client'
import React from 'react'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export function ProfilePage({ userId }: { userId?: string }) {
  const { user } = useAuthStore()

  if (!user) {
    return <div className="p-8 text-center text-zinc-500">Loading Profile...</div>
  }

  return (
    <div className="flex-1 p-6 md:p-8 max-w-2xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      <div className="flex items-center gap-6 mb-8 bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <Avatar className="w-24 h-24">
          <AvatarImage src={user.photoURL || ''} />
          <AvatarFallback className="text-2xl">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-semibold">{user.displayName}</h2>
          <p className="text-zinc-500">{user.email}</p>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Settings</h3>
        <Button variant="outline" className="w-full justify-start">Edit Profile</Button>
        <Button variant="outline" className="w-full justify-start">Privacy & Safety</Button>
        <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">Delete Account</Button>
      </div>
    </div>
  )
}

