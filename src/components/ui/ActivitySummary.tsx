'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Flame } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'

interface ActivityData {
  reviewCount: number
  helpfulCount: number
  commentCount: number
  topReview: { id: string; title: string; helpful_count: number; subject_id: string } | null
}

export default function ActivitySummary({ locale }: { locale: string }) {
  const { user, loading } = useAuth()
  const [visible, setVisible] = useState(false)
  const [data, setData] = useState<ActivityData | null>(null)
  const ko = locale === 'ko'

  useEffect(() => {
    if (loading || !user) return

    // Only show once per session
    const shown = sessionStorage.getItem('activity_shown')
    if (shown) return

    const fetchData = async () => {
      const supabase = createClient()

      const [
        { data: profile },
        { count: commentCount },
        { data: topReview },
      ] = await Promise.all([
        supabase
          .from('public_profiles')
          .select('review_count, total_helpful_count')
          .eq('id', user.id)
          .single(),
        supabase
          .from('review_comments')
          .select('id', { count: 'exact', head: true })
          .in('review_id',
            (await supabase.from('reviews').select('id').eq('user_id', user.id)).data?.map(r => r.id) ?? []
          ),
        supabase
          .from('reviews')
          .select('id, title, helpful_count, subject_id')
          .eq('user_id', user.id)
          .order('helpful_count', { ascending: false })
          .limit(1)
          .single(),
      ])

      const reviewCount = profile?.review_count ?? 0
      const helpfulCount = profile?.total_helpful_count ?? 0

      // Only show if user has some activity
      if (reviewCount > 0) {
        setData({
          reviewCount,
          helpfulCount,
          commentCount: commentCount ?? 0,
          topReview: topReview ?? null,
        })

        // Delay showing after splash screen fades
        setTimeout(() => setVisible(true), 2800)
      }
    }

    fetchData()
  }, [user, loading])

  const handleClose = () => {
    setVisible(false)
    sessionStorage.setItem('activity_shown', '1')
  }

  const nickname = user?.user_metadata?.nickname || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'

  return (
    <AnimatePresence>
      {visible && data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
            className="bg-card rounded-2xl shadow-2xl border border-border p-6 mx-4 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {ko ? `안녕하세요, ${nickname}님! 👋` : `Hello, ${nickname}! 👋`}
              </h2>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground text-lg"
              >
                ✕
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-primary/5 rounded-xl">
                <p className="text-xl font-bold text-primary">{data.reviewCount}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {ko ? '작성 리뷰' : 'Reviews'}
                </p>
              </div>
              <div className="text-center p-3 bg-green-500/5 rounded-xl">
                <p className="text-xl font-bold text-green-600">{data.helpfulCount}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {ko ? '도움이 됐어요' : 'Helpful'}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-500/5 rounded-xl">
                <p className="text-xl font-bold text-blue-600">{data.commentCount}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {ko ? '받은 댓글' : 'Comments'}
                </p>
              </div>
            </div>

            {/* Top Review */}
            {data.topReview && data.topReview.helpful_count > 0 && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 dark:border-amber-500/20 rounded-xl p-3 mb-4">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  {ko ? '가장 인기 있는 리뷰' : 'Most Popular Review'}
                </p>
                <Link
                  href={`/${locale}/subject/${data.topReview.subject_id}`}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                  onClick={handleClose}
                >
                  &ldquo;{data.topReview.title}&rdquo;
                </Link>
                <p className="text-xs text-muted-foreground mt-1">
                  👍 {data.topReview.helpful_count}{ko ? '명에게 도움이 됐어요' : ' found this helpful'}
                </p>
              </div>
            )}

            {/* CTA */}
            <Link
              href={`/${locale}/explore`}
              onClick={handleClose}
              className="block w-full text-center py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/80 transition-colors"
            >
              {ko ? '새로운 평가하러 가기 ⚡' : 'Write a New Rating ⚡'}
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
