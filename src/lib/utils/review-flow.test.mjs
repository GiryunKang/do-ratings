import assert from 'node:assert/strict'
import { test, beforeEach } from 'node:test'
import { safeReturnTo, parseInitialRating } from './return-to.ts'
import { draftKey, saveDraft, readDraft, beginDraftTransfer, adoptGuestDraft } from './draft.ts'
import { reviewSubRatings, savedRatingMatches } from './review-save.ts'

beforeEach(() => {
  const values = new Map()
  globalThis.sessionStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
})

test('auth return keeps selected subject and score, blocks external and normalized escapes', () => {
  assert.equal(safeReturnTo('/ko/write/subject?rating=8'), '/ko/write/subject?rating=8')
  for (const value of ['https://evil.test', '//evil.test', '/ko/../../evil', '/ko/%2e%2e/evil', '/ko/\\evil', '/ko/auth/login', '/ko/%2f%2fevil', '/ko/\nevil']) assert.equal(safeReturnTo(value), '/ko', value)
  assert.equal(safeReturnTo(null, 'en'), '/en')
})

test('rating query validates scale and preserves half-stars instead of rounding', () => {
  assert.equal(parseInitialRating('7'), 3.5)
  assert.equal(parseInitialRating('10'), 5)
  for (const value of ['8garbage', '100', '-1', '0', 'Infinity', '7.3']) assert.equal(parseInitialRating(value), undefined)
})

test('anonymous draft transfers exactly once and cannot appear for another account', () => {
  const guestKey = draftKey('subject')
  const draft = { title: 'draft', content: 'experience', rating: 4, updatedAt: Date.now() }
  saveDraft(guestKey, draft)
  assert.equal(adoptGuestDraft('subject', 'alice'), null)
  beginDraftTransfer('subject')
  assert.deepEqual(adoptGuestDraft('subject', 'alice'), draft)
  assert.equal(readDraft(guestKey), null)
  assert.deepEqual(readDraft(draftKey('subject', 'alice')), draft)
  assert.equal(adoptGuestDraft('subject', 'bob'), null)
  assert.equal(readDraft(draftKey('subject', 'bob')), null)
  assert.notEqual(draftKey('subject'), guestKey)
})

test('server existing review discards guest transfer; other subjects are isolated', () => {
  const key = draftKey('a')
  saveDraft(key, { title: 'draft', content: 'content', rating: 3, updatedAt: Date.now() })
  beginDraftTransfer('a')
  assert.equal(adoptGuestDraft('b', 'alice'), null)
  assert.equal(adoptGuestDraft('a', 'alice', true), null)
  assert.equal(readDraft(key), null)
  assert.equal(readDraft(draftKey('a', 'alice')), null)
})

test('expired, malformed, and unavailable storage do not crash form recovery', () => {
  saveDraft('old', { title: 'draft', content: '', rating: 4, updatedAt: Date.now() - 86400001 })
  assert.equal(readDraft('old'), null)
  sessionStorage.setItem('bad', '{broken')
  assert.equal(readDraft('bad'), null)
  globalThis.sessionStorage = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
  assert.equal(readDraft('anything'), null)
  assert.equal(saveDraft('a', {}), false)
})

test('legacy trigger receives a real overall selection and detailed edits preserve prior criteria', () => {
  assert.deepEqual(reviewSubRatings(4), { overall: 4 })
  assert.deepEqual(reviewSubRatings(3, { overall: 5 }), { overall: 3 })
  const detailed = { quality: 2, service: 3 }
  assert.strictEqual(reviewSubRatings(4, detailed), detailed)
  assert.deepEqual(reviewSubRatings(4, {}), {})
})

test('mock save response accepts confirmed rating and rejects trigger drift or absent value', () => {
  assert.equal(savedRatingMatches({ id: 'new', overall_rating: '4.0' }.overall_rating, 4), true)
  for (const value of [0, null, undefined, '', 'NaN', 5]) assert.equal(savedRatingMatches(value, 4), false)
})
