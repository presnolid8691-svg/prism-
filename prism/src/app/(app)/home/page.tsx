'use client'
import React from 'react'

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col p-6">
      <h1 className="text-3xl font-bold mb-6">Home</h1>
      <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
        <p className="text-zinc-500">Select a chat or channel from the sidebar, or explore the feed.</p>
      </div>
    </div>
  )
}