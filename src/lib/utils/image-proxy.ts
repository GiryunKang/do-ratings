const ALLOWED_PROXY_HOSTS = new Set([
  'upload.wikimedia.org',
  'commons.wikimedia.org',
])

/**
 * Returns a safe image URL.
 * - If on allowed proxy host, returns /api/image-proxy URL (for caching/privacy)
 * - Returns null for non-http(s) schemes (blocks javascript:, data:, file:)
 * - Otherwise returns the original URL (Supabase storage, OAuth avatars, etc)
 */
export function proxyImageUrl(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    if (ALLOWED_PROXY_HOSTS.has(parsed.hostname)) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`
    }
    return url
  } catch {
    return null
  }
}
