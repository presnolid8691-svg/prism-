'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, Radio, Search, Bell, Bookmark, Phone, User, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { signOut } from '@/lib/firebase/auth'
import { cn } from '@/lib/utils/cn'

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  
  const navItems = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Chats', href: '/chats', icon: MessageSquare },
    { name: 'Channels', href: '/channels', icon: Radio },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Saved', href: '/saved', icon: Bookmark },
    { name: 'Calls', href: '/calls', icon: Phone },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-950">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">Prism</h1>
      </div>
      <div className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.name} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-colors", active ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800")}>
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <button onClick={signOut} className="flex items-center gap-3 px-3 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg w-full transition-colors dark:text-zinc-400 dark:hover:bg-zinc-800">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign out</span>
        </button>
      </div>
    </div>
  )
}