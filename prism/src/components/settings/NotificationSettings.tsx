'use client'
import React from 'react'

export function NotificationSettings() {
  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-bold mb-6">Notifications</h2>
      <div className="space-y-6 bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Push Notifications</h3>
            <p className="text-sm text-zinc-500">Receive alerts when you are mentioned</p>
          </div>
          <input type="checkbox" className="h-5 w-5 rounded border-zinc-300" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Email Digests</h3>
            <p className="text-sm text-zinc-500">Weekly summary of missed activity</p>
          </div>
          <input type="checkbox" className="h-5 w-5 rounded border-zinc-300" />
        </div>
      </div>
    </div>
  )
}