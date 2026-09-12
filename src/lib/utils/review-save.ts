export function reviewSubRatings(rating: number, existing?: Record<string, number>): Record<string, number> {
  if (!existing || (Object.keys(existing).length === 1 && 'overall' in existing)) return { overall: rating }
  // The legacy trigger recalculates only when sub_ratings changes on UPDATE.
  return existing
}

export function savedRatingMatches(saved: unknown, expected: number): boolean {
  return (typeof saved === 'number' || typeof saved === 'string') && Number.isFinite(Number(saved)) && Number(saved) === expected
}
