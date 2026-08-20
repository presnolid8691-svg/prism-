'use client'
import React from 'react'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'

export function PrivacySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Privacy</h3>
        <p className="text-sm text-zinc-500">Manage your online presence and data visibility.</p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col space-y-4 rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Online Status</h3>
            <p className="text-sm text-zinc-500">Control who can see when you are online.</p>
          </div>
          <Select defaultValue="everyone">
            <option value="everyone">Everyone</option>
            <option value="friends">Friends Only</option>
            <option value="nobody">Nobody</option>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Read Receipts</h3>
            <p className="text-sm text-zinc-500">Let others know when you have read their messages.</p>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Typing Indicators</h3>
            <p className="text-sm text-zinc-500">Show when you are currently typing a message.</p>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Search Visibility</h3>
            <p className="text-sm text-zinc-500">Allow users to find you via phone number or email address.</p>
          </div>
          <Switch />
        </div>
      </div>
    </div>
  )
}
