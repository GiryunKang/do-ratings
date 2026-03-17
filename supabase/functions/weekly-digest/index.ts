import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DigestData {
  userId: string
  email: string
  nickname: string
  topReviews: Array<{ title: string; rating: number; subject_name: string }>
  newFollowerCount: number
  helpfulCount: number
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Get all users with reviews
    const { data: users } = await supabase
      .from('users')
      .select('id, email, nickname')
      .gt('review_count', 0)

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: 'No users to notify' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const digests: DigestData[] = []

    for (const user of users) {
      // Get top reviews this week in categories user follows
      const { data: topReviews } = await supabase
        .from('reviews')
        .select('title, overall_rating, subjects(name)')
        .gte('created_at', oneWeekAgo.toISOString())
        .order('helpful_count', { ascending: false })
        .limit(5)

      // Get new followers this week
      const { count: newFollowers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id)
        .gte('created_at', oneWeekAgo.toISOString())

      // Get helpful votes received this week
      const { data: userReviews } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.id)

      const reviewIds = (userReviews ?? []).map(r => r.id)
      let helpfulCount = 0
      if (reviewIds.length > 0) {
        const { count } = await supabase
          .from('helpful_votes')
          .select('*', { count: 'exact', head: true })
          .in('review_id', reviewIds)
          .gte('created_at', oneWeekAgo.toISOString())
        helpfulCount = count ?? 0
      }

      const formattedReviews = (topReviews ?? []).map(r => ({
        title: r.title,
        rating: Number(r.overall_rating),
        subject_name: typeof r.subjects === 'object' && r.subjects !== null
          ? ((r.subjects as any).name?.en ?? (r.subjects as any).name?.ko ?? '')
          : '',
      }))

      digests.push({
        userId: user.id,
        email: user.email,
        nickname: user.nickname,
        topReviews: formattedReviews,
        newFollowerCount: newFollowers ?? 0,
        helpfulCount,
      })
    }

    // For now, just return the digest data
    // In production, integrate with an email service (Resend, SendGrid, etc.)
    // Example with Resend:
    // await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     from: 'digest@ratings.app',
    //     to: user.email,
    //     subject: `${user.nickname}, here's your weekly Ratings digest`,
    //     html: generateEmailHtml(digest),
    //   }),
    // })

    return new Response(
      JSON.stringify({
        message: `Digest prepared for ${digests.length} users`,
        digests: digests.map(d => ({
          email: d.email,
          topReviewCount: d.topReviews.length,
          newFollowers: d.newFollowerCount,
          helpfulVotes: d.helpfulCount,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
