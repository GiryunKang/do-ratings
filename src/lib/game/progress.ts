export const EXPLORER_CATEGORIES = [
  { slug: 'restaurants', ko: '맛집', en: 'Restaurants' },
  { slug: 'places', ko: '장소', en: 'Places' },
  { slug: 'hotels', ko: '호텔', en: 'Hotels' },
  { slug: 'airlines', ko: '항공사', en: 'Airlines' },
  { slug: 'companies', ko: '기업', en: 'Companies' },
  { slug: 'people', ko: '인물', en: 'People' },
] as const

export const EXPLORER_STAGES = [
  { minimum: 0, ko: '탐험 준비', en: 'Ready to explore' },
  { minimum: 1, ko: '첫 발자국', en: 'First steps' },
  { minimum: 3, ko: '취향 발견', en: 'Finding your taste' },
  { minimum: 10, ko: '취향 탐험가', en: 'Taste explorer' },
  { minimum: 25, ko: '경험 수집가', en: 'Experience collector' },
  { minimum: 50, ko: '탐험 길잡이', en: 'Explorer guide' },
] as const

export interface ExplorerReview {
  id: string
  subjectId: string
  categorySlug: string | null
  createdAt: string
  isDeleted?: boolean
}

// A single documented day boundary for missions and streaks, independent of device timezone.
export function koreaDayKey(value: Date | string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function dailyCategory(now: Date = new Date()) {
  const day = koreaDayKey(now)
  const dayNumber = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000)
  return EXPLORER_CATEGORIES[((dayNumber % 6) + 6) % 6]
}

export function calculateProgress(reviews: readonly ExplorerReview[], now: Date = new Date()) {
  // A review edit, duplicate response, or repeated refresh cannot add progress.
  const unique = new Map<string, ExplorerReview>()
  for (const review of reviews) {
    if (review.isDeleted || !review.subjectId || !review.id || !koreaDayKey(review.createdAt)) continue
    const previous = unique.get(review.subjectId)
    if (!previous || review.createdAt < previous.createdAt) unique.set(review.subjectId, review)
  }
  const savedReviews = [...unique.values()]
  const total = savedReviews.length
  const stageIndex = EXPLORER_STAGES.reduce((index, stage, candidate) => total >= stage.minimum ? candidate : index, 0)
  const stage = EXPLORER_STAGES[stageIndex]
  const nextStage = EXPLORER_STAGES[stageIndex + 1] ?? null
  const today = koreaDayKey(now)
  const todayReviews = savedReviews.filter(review => koreaDayKey(review.createdAt) === today)
  const stamps = EXPLORER_CATEGORIES.map(category => ({
    ...category,
    count: savedReviews.filter(review => review.categorySlug === category.slug).length,
  }))
  const reviewedDays = new Set(savedReviews.map(review => koreaDayKey(review.createdAt)))
  let cursor = Date.parse(`${today}T00:00:00Z`)
  // Yesterday's run stays available until today's day ends.
  if (!reviewedDays.has(today)) cursor -= 86400000
  let streak = 0
  while (reviewedDays.has(new Date(cursor).toISOString().slice(0, 10))) {
    streak++
    cursor -= 86400000
  }
  const mission = dailyCategory(now)
  return {
    total, stage, stageIndex, nextStage, stamps, streak,
    categoryCount: stamps.filter(stamp => stamp.count > 0).length,
    todayCount: todayReviews.length,
    dailyMission: mission,
    dailyCompleted: todayReviews.some(review => review.categorySlug === mission.slug),
    stagePercent: nextStage ? Math.min(100, ((total - stage.minimum) / (nextStage.minimum - stage.minimum)) * 100) : 100,
  }
}

export type ExplorerProgress = ReturnType<typeof calculateProgress>
