'use client'

interface StoryViewerProps {
  userId: string
  storyIndex?: number
  onClose?: () => void
}

export function StoryViewer({ userId, storyIndex = 0, onClose }: StoryViewerProps) {
  return (
    <div className="p-4 bg-black text-white absolute inset-0 z-50 flex items-center justify-center">
      <div>
        <p>Story Viewer Placeholder for {userId} at index {storyIndex}</p>
        <button className="mt-4 p-2 bg-zinc-800 rounded" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
