import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const rateLimit = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) { rateLimit.set(ip, { count: 1, resetAt: now + windowMs }); return true }
  if (entry.count >= limit) return false
  entry.count++; return true
}

export async function DELETE(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 3, 60000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = user.id

  try {
    // Delete user data in order (respecting foreign keys)
    const { error: errComments } = await supabase.from('review_comments').delete().eq('user_id', userId)
    if (errComments) console.error('[AccountDelete] review_comments delete error:', errComments.message)

    const { error: errHelpful } = await supabase.from('helpful_votes').delete().eq('user_id', userId)
    if (errHelpful) console.error('[AccountDelete] helpful_votes delete error:', errHelpful.message)

    const { error: errNotHelpful } = await supabase.from('not_helpful_votes').delete().eq('user_id', userId)
    if (errNotHelpful) console.error('[AccountDelete] not_helpful_votes delete error:', errNotHelpful.message)

    const { error: errReactions } = await supabase.from('review_reactions').delete().eq('user_id', userId)
    if (errReactions) console.error('[AccountDelete] review_reactions delete error:', errReactions.message)

    const { error: errBattleVotes } = await supabase.from('battle_votes').delete().eq('user_id', userId)
    if (errBattleVotes) console.error('[AccountDelete] battle_votes delete error:', errBattleVotes.message)

    const { error: errNotifications } = await supabase.from('notifications').delete().eq('user_id', userId)
    if (errNotifications) console.error('[AccountDelete] notifications delete error:', errNotifications.message)

    const { error: errCollectionItems } = await supabase.from('collection_items').delete().in('collection_id',
      (await supabase.from('collections').select('id').eq('user_id', userId)).data?.map(c => c.id) ?? []
    )
    if (errCollectionItems) console.error('[AccountDelete] collection_items delete error:', errCollectionItems.message)

    const { error: errCollections } = await supabase.from('collections').delete().eq('user_id', userId)
    if (errCollections) console.error('[AccountDelete] collections delete error:', errCollections.message)

    const { error: errFollows } = await supabase.from('follows').delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`)
    if (errFollows) console.error('[AccountDelete] follows delete error:', errFollows.message)

    const { error: errReports } = await supabase.from('reports').delete().eq('reporter_id', userId)
    if (errReports) console.error('[AccountDelete] reports delete error:', errReports.message)

    // Delete review images from storage
    const { data: userReviews } = await supabase.from('reviews').select('id').eq('user_id', userId)
    if (userReviews && userReviews.length > 0) {
      const reviewIds = userReviews.map(r => r.id)
      const { error: errReviewImages } = await supabase.from('review_images').delete().in('review_id', reviewIds)
      if (errReviewImages) console.error('[AccountDelete] review_images delete error:', errReviewImages.message)
    }

    // Delete reviews
    const { error: errReviews } = await supabase.from('reviews').delete().eq('user_id', userId)
    if (errReviews) console.error('[AccountDelete] reviews delete error:', errReviews.message)

    // Sign out
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Account deletion error:', e)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
