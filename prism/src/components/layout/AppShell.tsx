'use client'

import React from 'react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { DetailPane } from './DetailPane'
import { useUIStore } from '@/store/uiStore'

export function AppShell({ children }: { children: React.ReactNode }) {
  const isDetailPaneOpen = useUIStore((s) => s.isDetailPaneOpen)

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950">
      <div className="hidden lg:flex"><Sidebar /></div>
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      {isDetailPaneOpen && <div className="hidden lg:flex w-80 border-l border-zinc-200 dark:border-zinc-800"><DetailPane /></div>}
      <div className="lg:hidden"><BottomNav /></div>
    </div>
  )
}