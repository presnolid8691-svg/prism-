import Link from 'next/link'
import { ChevronRight, Sun, Bell, Shield, Monitor, Download, Info } from 'lucide-react'

export const metadata = { title: 'Settings — Prism' }

const sections = [
  { href: '/settings/appearance', icon: Sun, label: 'Appearance', description: 'Theme and accent color' },
  { href: '/settings/notifications', icon: Bell, label: 'Notifications', description: 'Manage alerts and sounds' },
  { href: '/settings/privacy', icon: Shield, label: 'Privacy', description: 'Last seen, read receipts, blocked users' },
  { href: '/settings/sessions', icon: Monitor, label: 'Sessions', description: 'Manage active devices' },
  { href: '/settings/downloads', icon: Download, label: 'Download Apps', description: 'Get Prism on all your devices' },
]

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Settings</h1>

      <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
        {sections.map(({ href, icon: Icon, label, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 px-4 py-4 hover:bg-zinc-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors">
              <Icon className="w-5 h-5 text-zinc-500 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900">{label}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* About section */}
      <div className="mt-4 bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-4">
          <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900">About Prism</p>
            <p className="text-xs text-zinc-500 mt-0.5">Version 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}