'use client'

import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { usePresence } from '@/hooks/usePresence'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { uid } = useAuth()
  usePresence() // activate presence sync
  
  return (
    <AuthGuard>
      <AppShell>
        {children}
      </AppShell>
    </AuthGuard>
  )
}