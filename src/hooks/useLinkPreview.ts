'use client'

import { useEffect, useRef, useState } from 'react'

interface OGData {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
}

interface UseLinkPreviewReturn {
  linkPreview: OGData | null
  isLoading: boolean
}

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi

export function useLinkPreview(text: string): UseLinkPreviewReturn {
  const [linkPreview, setLinkPreview] = useState<OGData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Detect URLs in text
    const matches = text.match(URL_REGEX)
    const url = matches?.[0]

    if (!url) {
      setLinkPreview(null)
      setIsLoading(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      // Abort previous request if any
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()

      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/link-preview?url=${encodeURIComponent(url)}`,
          { signal: abortRef.current.signal }
        )
        if (response.ok) {
          const data: OGData = await response.json()
          setLinkPreview(data)
        } else {
          setLinkPreview(null)
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('[useLinkPreview] fetch error:', err)
          setLinkPreview(null)
        }
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [text])

  return { linkPreview, isLoading }
}
