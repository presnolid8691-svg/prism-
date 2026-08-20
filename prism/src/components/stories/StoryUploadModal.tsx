'use client'

interface StoryUploadModalProps {
  open: boolean
  onClose: () => void
}

export function StoryUploadModal({ open, onClose }: StoryUploadModalProps) {
  if (!open) return null
  return (
    <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Upload Story</h2>
        <p className="text-zinc-500 mb-6">Select a photo or video to share to your story.</p>
        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 bg-zinc-200 text-zinc-900 rounded-md" onClick={onClose}>
            Cancel
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={onClose}>
            Upload
          </button>
        </div>
      </div>
    </div>
  )
}
