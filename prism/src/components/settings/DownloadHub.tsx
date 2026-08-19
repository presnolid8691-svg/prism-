'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Download,
  Monitor,
  Smartphone,
  Apple,
  Terminal,
  Globe,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Zap,
  Bell,
  Cpu,
  Layers,
  QrCode,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils/cn'

export function DownloadHub() {
  const [downloadingPlatform, setDownloadingPlatform] = useState<string | null>(null)
  const [showQrModal, setShowQrModal] = useState(false)

  const handleDownload = (platform: string, filename: string) => {
    setDownloadingPlatform(platform)
    setTimeout(() => {
      setDownloadingPlatform(null)
      // Trigger a simulated safe client download
      const element = document.createElement('a')
      element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent('Prism Client Release 1.0.0 Package')}`)
      element.setAttribute('download', filename)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }, 1200)
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      {/* Top Bar Navigation */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                Download Prism Apps
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Available natively on desktop, mobile, and web
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            v1.0.0 Stable
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 sm:p-8 shadow-lg">
            <div className="relative z-10 max-w-xl">
              <Badge className="bg-white/20 text-white hover:bg-white/30 border-none mb-3">
                <Sparkles className="w-3 h-3 mr-1" />
                Native & Ultra-Fast
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                Take Prism everywhere you go
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">
                Experience crystal clear WebRTC calls, instant notifications, hardware-accelerated performance, and seamless multi-device syncing across all platforms.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => handleDownload('windows', 'Prism-Setup-1.0.0.exe')}
                  disabled={!!downloadingPlatform}
                  className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-md"
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  {downloadingPlatform === 'windows' ? 'Downloading...' : 'Download for Windows'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowQrModal(true)}
                  className="bg-blue-500/30 text-white border-white/30 hover:bg-blue-500/50 hover:text-white"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan for Mobile
                </Button>
              </div>
            </div>
            {/* Background glowing circle decorative */}
            <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          </div>

          {/* Platform Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Windows Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    64-bit Windows
                  </Badge>
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-1">
                  Windows Desktop
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                  System tray background operation, global hotkeys, high DPI support, and native notifications.
                </p>
                <div className="space-y-1.5 mb-6 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Windows 10 / 11 (x64, ARM64)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Auto-updating background service</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  onClick={() => handleDownload('windows', 'Prism-Setup-1.0.0.exe')}
                  disabled={downloadingPlatform === 'windows'}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  {downloadingPlatform === 'windows' ? 'Starting...' : 'Download .exe'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownload('windows-portable', 'Prism-1.0.0-Portable.zip')}
                  className="text-xs"
                  title="Download Portable ZIP"
                >
                  .zip
                </Button>
              </div>
            </div>

            {/* Android Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Android 8.0+
                  </Badge>
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-1">
                  Android Application
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                  FCM Push notifications, background WebRTC call ringing, haptic feedback, and low battery consumption.
                </p>
                <div className="space-y-1.5 mb-6 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Direct APK installation or Play Store</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Optimized for smartphones and tablets</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  onClick={() => handleDownload('android', 'Prism-app-release.apk')}
                  disabled={downloadingPlatform === 'android'}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  {downloadingPlatform === 'android' ? 'Starting...' : 'Download .apk'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowQrModal(true)}
                  className="text-xs"
                >
                  <QrCode className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* macOS Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
                    <Apple className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    macOS 12+
                  </Badge>
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-1">
                  macOS (Apple Silicon & Intel)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                  Universal DMG build built for Apple Silicon M1/M2/M3 and Intel Mac computers.
                </p>
                <div className="space-y-1.5 mb-6 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Menu bar quick actions & dark mode</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  onClick={() => handleDownload('mac-arm', 'Prism-1.0.0-arm64.dmg')}
                  disabled={downloadingPlatform === 'mac-arm'}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Apple Silicon (.dmg)
                </Button>
                <Button
                  onClick={() => handleDownload('mac-intel', 'Prism-1.0.0-x64.dmg')}
                  disabled={downloadingPlatform === 'mac-intel'}
                  variant="outline"
                  className="flex-1"
                >
                  Intel (.dmg)
                </Button>
              </div>
            </div>

            {/* Linux & Web PWA Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Linux / PWA
                  </Badge>
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-1">
                  Linux & Progressive Web App
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                  Available as an AppImage / .deb package or install directly in Chrome/Edge/Safari as a desktop PWA.
                </p>
                <div className="space-y-1.5 mb-6 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Ubuntu, Debian, Fedora, Arch Linux</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  onClick={() => handleDownload('linux-appimage', 'Prism-1.0.0.AppImage')}
                  disabled={downloadingPlatform === 'linux-appimage'}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  AppImage
                </Button>
                <Button
                  onClick={() => handleDownload('linux-deb', 'prism_1.0.0_amd64.deb')}
                  disabled={downloadingPlatform === 'linux-deb'}
                  variant="outline"
                  className="flex-1"
                >
                  .deb
                </Button>
              </div>
            </div>
          </div>

          {/* Key Advantages Grid */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">
              Native App Highlights
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    Hardware Acceleration
                  </h4>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Smooth 60fps animations and GPU-accelerated video decoding for calls.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Bell className="w-4 h-4 text-blue-500" />
                  <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    Background Ringing
                  </h4>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Never miss an incoming WebRTC call or direct message even when minimized.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    Encrypted Storage
                  </h4>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  End-to-end secret chat keys are safely stored in your system keychain.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* QR Code Modal for Mobile Quick Download */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-sm w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Download on Mobile
            </h3>
            <p className="text-xs text-zinc-500 mb-6">
              Scan this QR code with your phone camera to download the Android APK or launch the PWA.
            </p>

            <div className="w-48 h-48 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-inner mb-6">
              {/* Render visual QR mockup */}
              <div className="grid grid-cols-6 gap-1 w-full h-full p-2">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-xs',
                      (i % 2 === 0 || i % 7 === 0 || i < 6 || i > 30)
                        ? 'bg-zinc-900 dark:bg-zinc-100'
                        : 'bg-transparent'
                    )}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}