'use client'
import React from 'react'

export function DetailPane() {
  return (
    <div className="flex flex-col h-full w-full bg-zinc-50 dark:bg-zinc-900/50 p-6">
      <h2 className="font-semibold text-lg mb-4 text-zinc-900 dark:text-zinc-100">Discover</h2>
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        Nothing selected
      </div>
    </div>
  )
}