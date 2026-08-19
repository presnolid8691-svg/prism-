'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  Lock,
  Flame,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Info,
  KeyRound,
  CheckCircle2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

export interface SecretChatBannerProps {
  /** Whether the chat is a secret chat */
  isSecretChat?: boolean
  /** Encryption cipher name */
  encryptionType?: string
  /** Safety number or key fingerprint */
  keyFingerprint?: string
  /** Callback to learn more */
  onLearnMore?: () => void
  /** Callback to dismiss or close the banner */
  onClose?: () => void
  /** Custom Tailwind classes */
  className?: string
  /** Default expanded details */
  showDetails?: boolean
}

/**
 * Banner rendered at top of secret / encrypted chats explaining security parameters.
 */
export function SecretChatBanner({
  isSecretChat = true,
  encryptionType = 'AES-256-GCM (End-to-End)',
  keyFingerprint = '4829 1048 7721 9934',
  onLearnMore,
  onClose,
  className,
  showDetails: initialShowDetails = false,
}: SecretChatBannerProps) {
  const [expanded, setExpanded] = useState(initialShowDetails)
  const [dismissed, setDismissed] = useState(false)

  if (!isSecretChat || dismissed) return null

  return (
    <div
      className={cn(
        'w-full bg-emerald-500/10 dark:bg-emerald-950/40 border-b border-emerald-500/20 px-4 py-2 text-emerald-900 dark:text-emerald-200 transition-all text-xs',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate">End-to-End Encrypted Chat</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-mono">
                <Lock className="h-2.5 w-2.5" />
                {encryptionType}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 truncate">
              Messages are encrypted on your devices and cannot be read by Prism or third parties.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7 px-2 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-900"
          >
            <span className="hidden sm:inline mr-1">{expanded ? 'Hide info' : 'Details'}</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>

          {onClose ? (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-900 dark:text-emerald-300"
              title="Close banner"
              aria-label="Close banner"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-md text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-900 dark:text-emerald-300"
              title="Dismiss banner"
              aria-label="Dismiss banner"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Security Highlights */}
      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-5xl mx-auto animate-in fade-in duration-200">
          <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/5 dark:bg-emerald-900/20">
            <KeyRound className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[11px]">Safety Number</p>
              <p className="font-mono text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
                {keyFingerprint}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/5 dark:bg-emerald-900/20">
            <Flame className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[11px]">Self-Destruct Timers</p>
              <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
                Messages vanish after being viewed.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/5 dark:bg-emerald-900/20">
            <EyeOff className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[11px]">Zero Server Logs</p>
              <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
                No plaintext metadata is ever stored.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SecretChatBanner
