'use client'
import React from 'react'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

export function AdvancedSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Advanced</h3>
        <p className="text-sm text-zinc-500">For power users and developers.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Developer Mode</h3>
            <p className="text-sm text-zinc-500">Enable advanced debugging tools and experimental features.</p>
          </div>
          <Switch />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Hardware Acceleration</h3>
            <p className="text-sm text-zinc-500">Use GPU to render interface for smoother performance.</p>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="flex flex-col space-y-4 rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">Cache Limit</h3>
            <p className="text-sm text-zinc-500">Maximum amount of disk space used for media cache (in GB).</p>
          </div>
          <Slider defaultValue={2} min={1} max={10} step={1} />
        </div>

        <div className="flex flex-col space-y-4 rounded-lg border p-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium">API Endpoint</h3>
            <p className="text-sm text-zinc-500">Select the primary server region for connection.</p>
          </div>
          <Select defaultValue="auto">
            <option value="auto">Automatic (Recommended)</option>
            <option value="us-east">US East</option>
            <option value="us-west">US West</option>
            <option value="eu-central">EU Central</option>
            <option value="ap-south">Asia Pacific</option>
          </Select>
        </div>
      </div>
    </div>
  )
}
