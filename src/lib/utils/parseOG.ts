export interface OGData {
  url: string
  title: string
  description: string
  imageURL: string
  siteName: string
}

/**
 * Extract Open Graph metadata from a URL.
 * Uses a simple regex approach to avoid a full HTML parser dependency.
 * Runs server-side only (no CORS restrictions).
 *
 * @param url - The URL to fetch Open Graph data from
 * @returns   OGData object, or null if the fetch/parse fails
 */
export async function fetchOGData(url: string): Promise<OGData | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    let html: string
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          // Some sites block requests without a user-agent
          'User-Agent':
            'Mozilla/5.0 (compatible; PrismBot/1.0; +https://prism.app)',
        },
      })

      if (!res.ok) return null
      html = await res.text()
    } finally {
      clearTimeout(timeoutId)
    }

    /**
     * Extract the content of a meta tag by property or name attribute.
     * Handles both single and double quotes.
     */
    function extractMeta(property: string): string {
      // Match both property="og:xxx" and name="og:xxx" variants
      const patterns = [
        new RegExp(
          `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`,
          'i',
        ),
        new RegExp(
          `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`,
          'i',
        ),
        new RegExp(
          `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`,
          'i',
        ),
        new RegExp(
          `<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`,
          'i',
        ),
      ]

      for (const pattern of patterns) {
        const match = html.match(pattern)
        if (match?.[1]) return decodeHTMLEntities(match[1].trim())
      }
      return ''
    }

    /**
     * Extract the <title> tag content as a fallback for og:title.
     */
    function extractTitle(): string {
      const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
      return match?.[1] ? decodeHTMLEntities(match[1].trim()) : ''
    }

    const title = extractMeta('og:title') || extractTitle()
    const description =
      extractMeta('og:description') || extractMeta('description')
    const imageURL = extractMeta('og:image')
    const siteName = extractMeta('og:site_name')

    // Only return data if we got at least a title
    if (!title && !description) return null

    return {
      url,
      title,
      description,
      imageURL,
      siteName,
    }
  } catch {
    // Network errors, timeouts, parse errors — all silently return null
    return null
  }
}

/**
 * Decode common HTML entities in extracted meta tag content.
 */
function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(parseInt(code, 10)),
    )
}
