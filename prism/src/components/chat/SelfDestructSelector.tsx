'use client'

import React, { useState } from 'react'
import {
  Flame,
  Clock,
  Check,
  Zap,
  Timer,
  ChevronDown,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export interface SelfDestructOption {
  label: string
  seconds: 5 | 10 | 30 | null
  description: string
}

export const SELF_DESTRUCT_PRESETS: SelfDestructOption[] = [
  { label: 'Off', seconds: null, description: 'Messages do not disappear' },
  { label: '5 seconds', seconds: 5, description: 'Disappears 5s after viewing' },
  { label: '10 seconds', seconds: 10, description: 'Disappears 10s after viewing' },
  { label: '30 seconds', seconds: 30, description: 'Disappears 30s after viewing' },
]

export interface SelfDestructSelectorProps {
  /** Current selected self-destruct duration in seconds */
  value?: 5 | 10 | 30 | number | null
  /** Alias for value */
  selectedDuration?: 5 | 10 | 30 | number | null
  /** Change callback */
  onChange?: (seconds: 5 | 10 | 30 | null) => void
  /** Alias for onChange */
  onSelect?: (seconds: 5 | 10 | 30 | null) => void
  /** Whether the selector is disabled */
  disabled?: boolean
  /** Custom classes */
  className?: string
  /** Rendering style */
  variant?: 'dropdown' | 'pills' | 'icon'
  /** Compact sizing */
  compact?: boolean
}

/**
 * Component for selecting message self-destruct timer (ephemeral messages).
 */
export function SelfDestructSelector({
  value,
  selectedDuration,
  onChange,
  onSelect,
  disabled = false,
  className,
  variant = 'dropdown',
  compact = false,
}: SelfDestructSelectorProps) {
  const currentVal = (value !== undefined ? value : selectedDuration) ?? null
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (sec: 5 | 10 | 30 | null) => {
    onChange?.(sec)
    onSelect?.(sec)
    setIsOpen(false)
  }

  const isEnabled = currentVal !== null && currentVal > 0
  const activeLabel = isEnabled ? `${currentVal}s` : 'Off'

  // Inline pills variant
  if (variant === 'pills') {
    return (
      <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
        <span className="text-xs font-medium text-zinc-500 flex items-center gap-1 mr-1">
          <Flame className={cn('h-3.5 w-3.5', isEnabled ? 'text-amber-500' : 'text-zinc-400')} />
          Timer:
        </span>
        {SELF_DESTRUCT_PRESETS.map((preset) => {
          const isSelected = currentVal === preset.seconds
          return (
            <button
              key={preset.label}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(preset.seconds)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-all select-none',
                isSelected
                  ? 'bg-amber-500 text-white shadow-xs font-semibold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
    )
  }

  // Dropdown / Icon trigger variant
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isEnabled ? 'default' : 'ghost'}
          size={compact ? 'sm' : 'default'}
          disabled={disabled}
          className={cn(
            'gap-1.5 transition-all select-none',
            isEnabled
              ? 'bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-xs'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100',
            compact ? 'h-8 px-2 text-xs' : 'h-9 px-3 text-sm',
            className
          )}
          title={`Self-destruct timer: ${activeLabel}`}
        >
          <Flame
            className={cn(
              compact ? 'h-3.5 w-3.5' : 'h-4 w-4',
              isEnabled ? 'text-white animate-pulse' : 'text-zinc-400'
            )}
          />
          <span className="font-mono text-xs">{activeLabel}</span>
          <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-1">
        <DropdownMenuLabel className="text-xs font-semibold text-zinc-500 flex items-center justify-between">
          <span>Self-Destruct Timer</span>
          <Flame className="h-3.5 w-3.5 text-amber-500" />
        </DropdownMenuLabel>
        <p className="px-2 pb-1.5 text-[11px] text-zinc-400">
          Messages disappear after the recipient views them.
        </p>
        <DropdownMenuSeparator />

        {SELF_DESTRUCT_PRESETS.map((preset) => {
          const isSelected = currentVal === preset.seconds
          return (
            <DropdownMenuItem
              key={preset.label}
              onClick={() => handleSelect(preset.seconds)}
              className={cn(
                'flex items-center justify-between py-2 px-2.5 rounded-md cursor-pointer text-xs',
                isSelected && 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-medium'
              )}
            >
              <div className="flex flex-col">
                <span className="font-medium">{preset.label}</span>
                <span className="text-[10px] text-zinc-400">{preset.description}</span>
              </div>
              {isSelected && <Check className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SelfDestructSelector
