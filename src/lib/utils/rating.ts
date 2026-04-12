export function calculateOverallRating(subRatings: Record<string, number>): number {
  const values = Object.values(subRatings)
  if (values.length === 0) return 0
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length
  return Math.round(avg * 2) / 2
}

export function validateRating(value: number): boolean {
  return value >= 1 && value <= 5 && value % 0.5 === 0
}

export function formatRating(value: number | null): string {
  if (value === null) return '-'
  return value.toFixed(1)
}

/**
 * Convert DB rating (0-5 scale) to display rating (0-10 scale).
 * The UI displays ratings as "X.X / 10" but the DB stores 0-5.
 */
export function displayRating(value: number | null | undefined): string {
  if (value == null) return '—'
  return (Number(value) * 2).toFixed(1)
}

/**
 * Compute bar fill percentage from DB rating (0-5 scale).
 * Returns 0-100 (percent).
 */
export function ratingPercent(value: number | null | undefined): number {
  if (value == null) return 0
  return Math.min(100, Math.max(0, (Number(value) / 5) * 100))
}
