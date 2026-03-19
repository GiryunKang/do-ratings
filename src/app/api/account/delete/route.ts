import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = user.id

  try {
    // Delete user data in order (respecting foreign keys)
    await supabase.from('review_comments').delete().eq('user_id', userId)
    await supabase.from('helpful_votes').delete().eq('user_id', userId)
    await supabase.from('not_helpful_votes').delete().eq('user_id', userId)
    await supabase.from('review_reactions').delete().eq('user_id', userId)
    await supabase.from('battle_votes').delete().eq('user_id', userId)
    await supabase.from('notifications').delete().eq('user_id', userId)
    await supabase.from('collection_items').delete().in('collection_id',
      (await supabase.from('collections').select('id').eq('user_id', userId)).data?.map(c => c.id) ?? []
    )
    await supabase.from('collections').delete().eq('user_id', userId)
    await supabase.from('follows').delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`)
    await supabase.from('reports').delete().eq('reporter_id', userId)

    // Delete review images from storage
    const { data: userReviews } = await supabase.from('reviews').select('id').eq('user_id', userId)
    if (userReviews && userReviews.length > 0) {
      const reviewIds = userReviews.map(r => r.id)
      await supabase.from('review_images').delete().in('review_id', reviewIds)
    }

    // Delete reviews
    await supabase.from('reviews').delete().eq('user_id', userId)

    // Sign out
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Account deletion error:', e)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
