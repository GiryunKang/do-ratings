// Return image URL directly — browsers can load Wikipedia images fine
// Proxy was causing 500 errors from server-side rate limiting
export function proxyImageUrl(url: string | null): string | null {
  return url
}
