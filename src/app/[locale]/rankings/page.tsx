'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { formatRating } from '@/lib/utils/rating'
import { timeAgo } from '@/lib/utils/timeAgo'
import StarRating from '@/components/review/StarRating'
import UserBadge from '@/components/user/UserBadge'

type Tab = 'subjects' | 'reviews' | 'reviewers'

interface Category {
  id: string
  name: { ko: string; en: string }
  slug: string
}

interface SubjectRank {
  id: string
  name: { ko: string; en: string }
  avg_rating: number | null
  review_count: number
}

interface ReviewRank {
  id: string
  title: string
  helpful_count: number
  overall_rating: number
  created_at: string
  subject_id: string
  user_id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public_profiles: any
}

interface ReviewerRank {
  id: string
  nickname: string
  avatar_url: string | null
  level: string
  review_count: number
}

const podiumStyles = [
  'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200',
  'bg-gradient-to-r from-gray-50 to-slate-100 border border-gray-200',
  'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200',
]

const badgeStyles = [
  'bg-gradient-to-r from-yellow-400 to-amber-400 text-white',
  'bg-gradient-to-r from-gray-300 to-slate-400 text-white',
  'bg-gradient-to-r from-orange-400 to-amber-500 text-white',
]

function SkeletonCards() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton h-14 rounded-xl" />
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )
}

export default function RankingsPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'ko'
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')

  const [activeTab, setActiveTab] = useState<Tab>('subjects')

  // Subjects tab state
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [topSubjects, setTopSubjects] = useState<SubjectRank[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(false)

  // Reviews tab state
  const [topReviews, setTopReviews] = useState<ReviewRank[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  // Reviewers tab state
  const [topReviewers, setTopReviewers] = useState<ReviewerRank[]>([])
  const [reviewersLoading, setReviewersLoading] = useState(false)

  // Load categories once
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('categories')
      .select('id, name, slug')
      .then(({ data }) => {
        if (data) {
          setCategories(data as Category[])
          if (data.length > 0) setSelectedCategoryId(data[0].id)
        }
      })
  }, [])

  // Load top subjects when category changes
  useEffect(() => {
    if (!selectedCategoryId) return
    setSubjectsLoading(true)
    const supabase = createClient()
    supabase
      .from('subjects')
      .select('id, name, avg_rating, review_count')
      .eq('category_id', selectedCategoryId)
      .order('avg_rating', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setTopSubjects((data as SubjectRank[]) ?? [])
        setSubjectsLoading(false)
      })
  }, [selectedCategoryId])

  // Load top reviews (this week's most helpful)
  useEffect(() => {
    if (activeTab !== 'reviews' || topReviews.length > 0) return
    setReviewsLoading(true)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const supabase = createClient()
    supabase
      .from('reviews')
      .select(`
        id,
        title,
        helpful_count,
        overall_rating,
        created_at,
        subject_id,
        user_id,
        public_profiles(id, nickname, level, avatar_url)
      `)
      .gte('created_at', oneWeekAgo.toISOString())
      .order('helpful_count', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setTopReviews((data as ReviewRank[]) ?? [])
        setReviewsLoading(false)
      })
  }, [activeTab, topReviews.length])

  // Load top reviewers
  useEffect(() => {
    if (activeTab !== 'reviewers' || topReviewers.length > 0) return
    setReviewersLoading(true)
    const supabase = createClient()
    supabase
      .from('public_profiles')
      .select('id, nickname, avatar_url, level, review_count')
      .order('review_count', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setTopReviewers((data as ReviewerRank[]) ?? [])
        setReviewersLoading(false)
      })
  }, [activeTab, topReviewers.length])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'subjects', label: 'Subjects' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'reviewers', label: 'Reviewers' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-5">{t('rankings')}</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Subjects Tab */}
      {activeTab === 'subjects' && (
        <div>
          {/* Category Selector */}
          <div className="mb-4">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name[locale as 'ko' | 'en'] ?? cat.name.en}
                </option>
              ))}
            </select>
          </div>

          {subjectsLoading ? (
            <SkeletonCards />
          ) : topSubjects.length === 0 ? (
            <EmptyState message={tCommon('noResults')} />
          ) : (
            <ol className="space-y-2 bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {topSubjects.map((subject, index) => {
                const name = subject.name[locale as 'ko' | 'en'] ?? subject.name.en
                const podiumStyle = index < 3 ? podiumStyles[index] : ''
                const badgeStyle = index < 3 ? badgeStyles[index] : 'bg-indigo-100 text-indigo-700'
                return (
                  <li key={subject.id} className={podiumStyle}>
                    <Link
                      href={`/${locale}/subject/${subject.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/60 transition-colors"
                    >
                      <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${badgeStyle}`}>
                        {index + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium text-gray-800 truncate">{name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <StarRating value={subject.avg_rating ?? 0} readonly size="sm" />
                        <span className="text-sm font-semibold text-yellow-500">
                          {formatRating(subject.avg_rating)}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div>
          <p className="text-xs text-gray-400 mb-3">Most helpful reviews this week</p>
          {reviewsLoading ? (
            <SkeletonCards />
          ) : topReviews.length === 0 ? (
            <EmptyState message={tCommon('noResults')} />
          ) : (
            <ol className="space-y-2">
              {topReviews.map((review, index) => {
                const profile = review.public_profiles
                const podiumStyle = index < 3 ? podiumStyles[index] : 'bg-white border border-gray-200'
                const badgeStyle = index < 3 ? badgeStyles[index] : 'bg-yellow-100 text-yellow-700'
                return (
                  <li
                    key={review.id}
                    className={`rounded-xl p-4 ${podiumStyle}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${badgeStyle}`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/${locale}/subject/${review.subject_id}`}
                          className="block font-semibold text-sm text-gray-900 hover:text-indigo-600 transition-colors mb-1 truncate"
                        >
                          {review.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {profile && (
                            <Link
                              href={`/${locale}/profile/${profile.id}`}
                              className="hover:underline"
                            >
                              {profile.nickname}
                            </Link>
                          )}
                          <span>·</span>
                          <StarRating value={review.overall_rating} readonly size="sm" />
                          <span>·</span>
                          <span>{review.helpful_count} helpful</span>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      )}

      {/* Reviewers Tab */}
      {activeTab === 'reviewers' && (
        <div>
          <p className="text-xs text-gray-400 mb-3">Top reviewers by review count</p>
          {reviewersLoading ? (
            <SkeletonCards />
          ) : topReviewers.length === 0 ? (
            <EmptyState message={tCommon('noResults')} />
          ) : (
            <ol className="space-y-2 bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {topReviewers.map((reviewer, index) => {
                const podiumStyle = index < 3 ? podiumStyles[index] : ''
                const badgeStyle = index < 3 ? badgeStyles[index] : 'bg-indigo-100 text-indigo-700'
                return (
                  <li key={reviewer.id} className={podiumStyle}>
                    <Link
                      href={`/${locale}/profile/${reviewer.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/60 transition-colors"
                    >
                      <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${badgeStyle}`}>
                        {index + 1}
                      </span>
                      {reviewer.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={reviewer.avatar_url}
                          alt={reviewer.nickname}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold flex items-center justify-center shrink-0">
                          {reviewer.nickname.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                        {reviewer.nickname}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <UserBadge level={(reviewer.level ?? 'bronze') as 'bronze' | 'silver' | 'gold' | 'platinum'} />
                        <span className="text-xs text-gray-500">{reviewer.review_count} reviews</span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}
