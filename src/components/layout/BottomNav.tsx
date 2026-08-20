'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, Radio, Search, User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function BottomNav() {
  const pathname = usePathname()
  const navItems = [
    { href: '/home', icon: Home },
    { href: '/chats', icon: MessageSquare },
    { href: '/channels', icon: Radio },
    { href: '/search', icon: Search },
    { href: '/profile', icon: User },
  ]

  return (
    <div className="flex items-center justify-around h-16 border-t border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800">
      {navItems.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} className={cn("p-3 rounded-full transition-colors", active ? "text-blue-600" : "text-zinc-500")}>
            <item.icon className="w-6 h-6" />
          </Link>
        )
      })}
    </div>
  )
}