'use client'
import React from 'react'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

export function AppearanceSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-zinc-500">Customize how Prism looks and feels on your device.</p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col space-y-4 rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Theme</h3>
            <p className="text-sm text-zinc-500">Select the overall color theme of the application.</p>
          </div>
          <Select defaultValue="system">
            <option value="system">System Default</option>
            <option value="light">Light Mode</option>
            <option value="dark">Dark Mode</option>
          </Select>
        </div>

        <div className="flex flex-col space-y-4 rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Accent Color</h3>
            <p className="text-sm text-zinc-500">Choose your favorite accent color for buttons and highlights.</p>
          </div>
          <Select defaultValue="blue">
            <option value="blue">Blue</option>
            <option value="purple">Purple</option>
            <option value="green">Green</option>
            <option value="orange">Orange</option>
            <option value="rose">Rose</option>
          </Select>
        </div>

        <div className="flex flex-col space-y-4 rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Chat Font Size</h3>
            <p className="text-sm text-zinc-500">Adjust the text size for all messages in the chat view.</p>
          </div>
          <Slider defaultValue={16} min={12} max={24} step={1} />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Compact Mode</h3>
            <p className="text-sm text-zinc-500">Reduce spacing between messages for a denser layout.</p>
          </div>
          <Switch />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Reduce Motion</h3>
            <p className="text-sm text-zinc-500">Disable UI animations to improve performance or reduce motion sickness.</p>
          </div>
          <Switch />
        </div>
      </div>
    </div>
  )
}
