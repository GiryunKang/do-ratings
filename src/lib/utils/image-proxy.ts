// Proxy Wikimedia images through our API to avoid hotlink blocking
export function proxyImageUrl(url: string | null): string | null {
  if (!url) return null
  if (url.includes('upload.wikimedia.org') || url.includes('commons.wikimedia.org')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`
  }
  return url
}
