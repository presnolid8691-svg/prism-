'use client'
import React, { useState } from 'react'
import { NotificationSettings } from './NotificationSettings'
import { AppearanceSettings } from './AppearanceSettings'
import { PrivacySettings } from './PrivacySettings'
import { AdvancedSettings } from './AdvancedSettings'
import { SessionManager } from './SessionManager'
import { DownloadHub } from './DownloadHub'
import { cn } from '@/lib/utils'
import { Bell, Palette, Shield, Settings, Monitor, Download } from 'lucide-react'

const SETTINGS_TABS = [
  { id: 'appearance', label: 'Appearance', icon: Palette, component: AppearanceSettings },
  { id: 'notifications', label: 'Notifications', icon: Bell, component: NotificationSettings },
  { id: 'privacy', label: 'Privacy', icon: Shield, component: PrivacySettings },
  { id: 'sessions', label: 'Sessions', icon: Monitor, component: SessionManager },
  { id: 'downloads', label: 'Downloads', icon: Download, component: DownloadHub },
  { id: 'advanced', label: 'Advanced', icon: Settings, component: AdvancedSettings },
]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState(SETTINGS_TABS[0].id)

  const ActiveComponent = SETTINGS_TABS.find(t => t.id === activeTab)?.component || AppearanceSettings

  return (
    <div className="flex h-full w-full max-w-6xl mx-auto p-6 md:p-10 gap-8">
      {/* Sidebar navigation */}
      <div className="w-full max-w-xs shrink-0 space-y-1">
        <h2 className="text-2xl font-bold mb-6 px-4">Settings</h2>
        <nav className="flex flex-col space-y-1">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors text-left",
                  isActive
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-600 hover:bg-zinc-100/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 overflow-y-auto pr-2 pb-12">
        <div className="max-w-3xl">
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}
