'use client'
import React from 'react'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

export function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-zinc-500">Configure how you receive alerts and messages.</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Push Notifications</h3>
            <p className="text-sm text-zinc-500">Receive push notifications when someone mentions you.</p>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Email Digests</h3>
            <p className="text-sm text-zinc-500">Weekly summary of missed activity and messages.</p>
          </div>
          <Switch />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Message Previews</h3>
            <p className="text-sm text-zinc-500">Show message content in notifications.</p>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="flex flex-col space-y-4 rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Notification Volume</h3>
            <p className="text-sm text-zinc-500">Set the volume for incoming notification sounds.</p>
          </div>
          <Slider defaultValue={75} max={100} step={1} />
        </div>

        <div className="flex flex-col space-y-4 rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Snooze Notifications</h3>
            <p className="text-sm text-zinc-500">Temporarily mute all notifications.</p>
          </div>
          <Select>
            <option value="none">Off</option>
            <option value="1">For 1 hour</option>
            <option value="8">For 8 hours</option>
            <option value="24">For 24 hours</option>
          </Select>
        </div>
      </div>
    </div>
  )
}