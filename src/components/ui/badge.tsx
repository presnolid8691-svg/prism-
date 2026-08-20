import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-blue-600 text-white shadow hover:bg-blue-600/80',
        secondary:
          'border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800/80',
        destructive:
          'border-transparent bg-red-500 text-white shadow hover:bg-red-500/80 dark:bg-red-900 dark:text-zinc-100 dark:hover:bg-red-900/80',
        outline:
          'text-zinc-950 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800',
        success:
          'border-transparent bg-emerald-500 text-white shadow hover:bg-emerald-500/80',
        warning:
          'border-transparent bg-amber-500 text-white shadow hover:bg-amber-500/80',
        info:
          'border-transparent bg-sky-500 text-white shadow hover:bg-sky-500/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
