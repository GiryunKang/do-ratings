import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateProgress, dailyCategory, koreaDayKey, EXPLORER_CATEGORIES } from './progress.ts'

const now = new Date('2026-09-12T03:00:00Z')
function review(id, categorySlug = 'places', createdAt = '2026-09-12T02:00:00Z') {
  return { id, subjectId: `subject-${id}`, categorySlug, createdAt }
}

test('empty history starts honestly at zero, with no earned stamp', () => {
  const state = calculateProgress([], now)
  assert.equal(state.total, 0)
  assert.equal(state.stageIndex, 0)
  assert.equal(state.categoryCount, 0)
  assert.equal(state.streak, 0)
  assert.equal(state.stagePercent, 0)
})

test('repeated requests and duplicate subject rows never add progress', () => {
  const saved = review('a')
  const state = calculateProgress([saved, saved, { ...saved, id: 'other-id' }], now)
  assert.equal(state.total, 1)
  assert.equal(state.stamps.find(stamp => stamp.slug === 'places').count, 1)
  assert.deepEqual(calculateProgress([saved], now), calculateProgress([saved], now))
})

test('all stage boundaries and next-stage distances are based on saved subjects', () => {
  for (const [count, stage] of [[0, 0], [1, 1], [2, 1], [3, 2], [9, 2], [10, 3], [24, 3], [25, 4], [49, 4], [50, 5], [501, 5]]) {
    const state = calculateProgress(Array.from({ length: count }, (_, index) => review(String(index))), now)
    assert.equal(state.stageIndex, stage)
    assert.ok(state.stagePercent >= 0 && state.stagePercent <= 100)
  }
})

test('deletion removes progress, invalid dates and missing subjects are excluded', () => {
  const state = calculateProgress([review('a'), { ...review('b'), isDeleted: true }, review('c', 'places', 'invalid'), { ...review('d'), subjectId: '' }], now)
  assert.equal(state.total, 1)
})

test('three category mission counts distinct known categories only', () => {
  const state = calculateProgress([review('a', 'places'), review('b', 'places'), review('c', 'hotels'), review('d', 'airlines'), review('e', 'other')], now)
  assert.equal(state.categoryCount, 3)
  assert.equal(state.total, 5)
})

test('all six category stamps can be collected', () => {
  const state = calculateProgress(EXPLORER_CATEGORIES.map((category, index) => review(String(index), category.slug)), now)
  assert.equal(state.categoryCount, 6)
  assert.ok(state.stamps.every(stamp => stamp.count === 1))
})

test('Korea midnight differs from UTC midnight and is timezone independent', () => {
  assert.equal(koreaDayKey('2026-09-11T14:59:59Z'), '2026-09-11')
  assert.equal(koreaDayKey('2026-09-11T15:00:00Z'), '2026-09-12')
  assert.equal(koreaDayKey('2026-09-12T00:00:00+09:00'), '2026-09-12')
})

test('today mission uses the same day boundary and excludes yesterday', () => {
  const category = dailyCategory(now).slug
  assert.equal(calculateProgress([review('old', category, '2026-09-11T14:59:59Z')], now).dailyCompleted, false)
  assert.equal(calculateProgress([review('new', category, '2026-09-11T15:00:00Z')], now).dailyCompleted, true)
  assert.equal(calculateProgress([review('new', category)], now).dailyCompleted, true)
})

test('mission is stable for the whole KST day and rotates through all categories', () => {
  assert.equal(dailyCategory(new Date('2026-09-11T15:00:00Z')).slug, dailyCategory(new Date('2026-09-12T14:59:59Z')).slug)
  const categories = new Set(Array.from({ length: 6 }, (_, day) => dailyCategory(new Date(now.getTime() + day * 86400000)).slug))
  assert.equal(categories.size, 6)
})

test('one-day streak is visible, yesterday is retained, gaps terminate the run', () => {
  assert.equal(calculateProgress([review('today')], now).streak, 1)
  assert.equal(calculateProgress([review('yesterday', 'places', '2026-09-11T03:00:00Z')], now).streak, 1)
  assert.equal(calculateProgress([review('old', 'places', '2026-09-10T03:00:00Z')], now).streak, 0)
  assert.equal(calculateProgress([review('today'), review('older', 'places', '2026-09-10T03:00:00Z')], now).streak, 1)
})

test('streak is not silently truncated at 30 days', () => {
  const rows = Array.from({ length: 45 }, (_, index) => review(String(index), 'places', new Date(now.getTime() - index * 86400000).toISOString()))
  assert.equal(calculateProgress(rows, now).streak, 45)
})

test('review edits retain creation date and cannot complete a new-day mission', () => {
  const category = dailyCategory(now).slug
  const original = review('a', category, '2026-09-10T03:00:00Z')
  const edited = { ...original, updatedAt: now.toISOString() }
  assert.equal(calculateProgress([edited], now).dailyCompleted, false)
  assert.equal(calculateProgress([edited], now).total, 1)
})
