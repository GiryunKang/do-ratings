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
