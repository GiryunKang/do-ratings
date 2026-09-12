/** Only locale-prefixed app routes are valid authentication return destinations. */
export function safeReturnTo(value: string | null | undefined, locale = 'ko'): string {
  const fallback = locale === 'en' ? '/en' : '/ko'
  if (!value || /[\\\u0000-\u0020]/.test(value) || /%(?:2f|5c|0[0-9a-f]|1[0-9a-f])/i.test(value)) return fallback
  if (!/^\/(ko|en)(?:\/|\?|$)/.test(value)) return fallback
  try {
    const url = new URL(value, 'https://return.invalid')
    if (url.origin !== 'https://return.invalid' || !/^\/(ko|en)(?:\/|$)/.test(url.pathname) || /^\/(ko|en)\/auth(?:\/|$)/.test(url.pathname)) return fallback
    return url.pathname + url.search + url.hash
  } catch {
    return fallback
  }
}

export function parseInitialRating(value: string | undefined): number | undefined {
  if (!value || !/^\d+(?:\.\d+)?$/.test(value)) return undefined
  const rating = Number(value) / 2
  return rating >= 1 && rating <= 5 && rating % 0.5 === 0 ? rating : undefined
}
