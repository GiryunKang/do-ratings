export interface ReviewDraft { title: string; content: string; rating: number; updatedAt: number }
const PREFIX = 'ratings:review-draft:'
const ANON = 'ratings:anonymous-draft-id'
const TRANSFER = 'ratings:review-draft-transfer'
const MAX_AGE = 24 * 60 * 60 * 1000

export function draftKey(subjectId: string, userId?: string | null): string {
  if (userId) return `${PREFIX}user:${userId}:${subjectId}`
  let anonymousId = sessionStorage.getItem(ANON)
  if (!anonymousId) {
    anonymousId = crypto.randomUUID()
    sessionStorage.setItem(ANON, anonymousId)
  }
  return `${PREFIX}anonymous:${anonymousId}:${subjectId}`
}

export function readDraft(key: string): ReviewDraft | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? 'null')
    if (!value || typeof value.title !== 'string' || typeof value.content !== 'string' ||
      !Number.isFinite(value.rating) || value.rating < 0 || value.rating > 5 || value.rating % 0.5 !== 0 ||
      !Number.isFinite(value.updatedAt) || Date.now() - value.updatedAt > MAX_AGE) return null
    return { title: value.title.slice(0, 100), content: value.content.slice(0, 5000), rating: value.rating, updatedAt: value.updatedAt }
  } catch { return null }
}

export function saveDraft(key: string, value: ReviewDraft): boolean {
  try { sessionStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

export function beginDraftTransfer(subjectId: string): void {
  try { sessionStorage.setItem(TRANSFER, JSON.stringify({ subjectId, key: draftKey(subjectId), at: Date.now() })) } catch { /* Storage may be blocked. */ }
}

/** A guest draft is consumed once by the account returning from the explicit sign-in flow. */
export function adoptGuestDraft(subjectId: string, userId: string, discard = false): ReviewDraft | null {
  try {
    const transfer = JSON.parse(sessionStorage.getItem(TRANSFER) ?? 'null')
    if (!transfer || transfer.subjectId !== subjectId) return null
    sessionStorage.removeItem(TRANSFER)
    if (transfer.key !== draftKey(subjectId) || !Number.isFinite(transfer.at) || Date.now() - transfer.at > MAX_AGE) return null
    const draft = readDraft(transfer.key)
    sessionStorage.removeItem(transfer.key)
    // Rotate anonymous identity so a later signed-out session cannot recover the previous draft.
    sessionStorage.removeItem(ANON)
    if (!draft || discard) return null
    saveDraft(draftKey(subjectId, userId), draft)
    return draft
  } catch { return null }
}

export function clearDraft(key: string): void {
  try { sessionStorage.removeItem(key) } catch { /* Storage may be blocked. */ }
}

export function claimPendingGuestDraft(userId: string): void {
  try {
    const transfer = JSON.parse(sessionStorage.getItem(TRANSFER) ?? 'null')
    if (typeof transfer?.subjectId === 'string') adoptGuestDraft(transfer.subjectId, userId)
  } catch { /* Storage may be blocked. */ }
}
