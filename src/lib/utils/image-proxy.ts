export function proxyImageUrl(url: string | null): string | null {
  if (!url) return null

  if (url.includes('upload.wikimedia.org') || url.includes('commons.wikimedia.org')) {
    return `/_next/image?url=${encodeURIComponent(url)}&w=640&q=75`
  }

  return url
}
