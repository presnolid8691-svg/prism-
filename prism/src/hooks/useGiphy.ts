'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface GiphyGif {
  id: string
  title: string
  images: {
    fixed_height: { url: string; width: string; height: string }
    original: { url: string }
    preview_gif: { url: string }
  }
}

interface UseGiphyReturn {
  gifs: GiphyGif[]
  isLoading: boolean
  search: (q: string) => void
  loadMore: () => void
  query: string
  setQuery: (q: string) => void
}

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY ?? ''
const PAGE_SIZE = 20

async function fetchGiphy(
  endpoint: string,
  params: Record<string, string | number>
): Promise<GiphyGif[]> {
  const searchParams = new URLSearchParams({
    api_key: GIPHY_API_KEY,
    limit: String(PAGE_SIZE),
    rating: 'g',
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  })
  const res = await fetch(`https://api.giphy.com/v1/gifs/${endpoint}?${searchParams}`)
  if (!res.ok) return []
  const json = await res.json()
  return json.data as GiphyGif[]
}

export function useGiphy(): UseGiphyReturn {
  const [gifs, setGifs] = useState<GiphyGif[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Load trending on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const trending = await fetchGiphy('trending', { offset: 0 })
        setGifs(trending)
        setOffset(PAGE_SIZE)
      } catch (err) {
        console.error('[useGiphy] trending error:', err)
      } finally {
        setIsLoading(false)
      }
    }
    if (!query) {
      load()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Search with debounce when query changes
  useEffect(() => {
    if (!query) {
      // Reset to trending
      const load = async () => {
        setIsLoading(true)
        try {
          const trending = await fetchGiphy('trending', { offset: 0 })
          setGifs(trending)
          setOffset(PAGE_SIZE)
        } catch (err) {
          console.error('[useGiphy] trending reset error:', err)
        } finally {
          setIsLoading(false)
        }
      }
      load()
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      setOffset(0)
      try {
        const results = await fetchGiphy('search', { q: query, offset: 0 })
        setGifs(results)
        setOffset(PAGE_SIZE)
      } catch (err) {
        console.error('[useGiphy] search error:', err)
      } finally {
        setIsLoading(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const search = useCallback((q: string) => {
    setQuery(q)
  }, [])

  const loadMore = useCallback(async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const endpoint = query ? 'search' : 'trending'
      const params: Record<string, string | number> = { offset }
      if (query) params.q = query
      const more = await fetchGiphy(endpoint, params)
      setGifs((prev) => [...prev, ...more])
      setOffset((prev) => prev + PAGE_SIZE)
    } catch (err) {
      console.error('[useGiphy] loadMore error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, query, offset])

  return { gifs, isLoading, search, loadMore, query, setQuery }
}
