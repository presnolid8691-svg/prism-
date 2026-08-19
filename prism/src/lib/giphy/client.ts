// Client-side GIPHY helper — all requests go through the /api/giphy/search proxy
// route so the real API key stays server-side.

export interface GiphyGif {
  id: string
  title: string
  images: {
    fixed_height: { url: string; width: string; height: string }
    original: { url: string }
    preview_gif: { url: string }
  }
}

/**
 * Search GIPHY for GIFs matching the given query string.
 *
 * @param query  - Search term
 * @param offset - Pagination offset (default 0)
 * @returns      Array of GiphyGif objects (empty on error)
 */
export async function searchGiphy(
  query: string,
  offset = 0,
): Promise<GiphyGif[]> {
  const res = await fetch(
    `/api/giphy/search?q=${encodeURIComponent(query)}&offset=${offset}`,
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.data as GiphyGif[]) || []
}

/**
 * Fetch currently trending GIFs from GIPHY.
 *
 * @param offset - Pagination offset (default 0)
 * @returns      Array of GiphyGif objects (empty on error)
 */
export async function trendingGiphy(offset = 0): Promise<GiphyGif[]> {
  const res = await fetch(`/api/giphy/search?trending=true&offset=${offset}`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.data as GiphyGif[]) || []
}
