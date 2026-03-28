'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const COLORS = [
  '#6366f1', // indigo-500
  '#a855f7', // purple-500
  '#f59e0b', // amber-500
  '#22c55e', // green-500
  '#3b82f6', // blue-500
  '#ec4899', // pink-500
]

interface Review {
  id: string
  title: string
  overall_rating: number
  created_at: string
  subject_id: string
  subjects: {
    name: string
    category_id: string
    categories: {
      name: string
      slug: string
    } | null
  } | null
}

interface Profile {
  review_count: number
  total_helpful_count: number
}

interface CategoryData {
  name: string
  count: number
}

interface MonthlyData {
  month: string
  count: number
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className={`bg-card rounded-2xl border border-border shadow-sm p-5`}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.startsWith('/en') ? 'en' : 'ko'

  const [profile, setProfile] = useState<Profile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/${currentLocale}/auth/login`)
    }
  }, [user, loading, router, currentLocale])

  // Fetch data
  useEffect(() => {
    if (!user) return

    async function fetchData() {
      const supabase = createClient()

      const [{ data: profileData }, { data: reviewsData }] = await Promise.all([
        supabase
          .from('public_profiles')
          .select('review_count, total_helpful_count')
          .eq('id', user!.id)
          .single(),
        supabase
          .from('reviews')
          .select(
            'id, title, overall_rating, created_at, subject_id, subjects(name, category_id, categories(name, slug))'
          )
          .eq('user_id', user!.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false }),
      ])

      setProfile(profileData ?? null)
      setReviews((reviewsData as unknown as Review[]) ?? [])
      setDataLoading(false)
    }

    void fetchData()
  }, [user])

  if (loading || !user || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Compute average rating
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length).toFixed(1)
      : '—'

  // Category breakdown
  const categoryMap = new Map<string, number>()
  for (const review of reviews) {
    const catName = review.subjects?.categories?.name ?? 'Other'
    categoryMap.set(catName, (categoryMap.get(catName) ?? 0) + 1)
  }
  const categoryData: CategoryData[] = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // Monthly activity (last 12 months)
  const now = new Date()
  const months: MonthlyData[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label =
      currentLocale === 'ko'
        ? `${d.getMonth() + 1}월`
        : d.toLocaleString('en', { month: 'short' })
    months.push({ month: label, count: 0 })
  }

  for (const review of reviews) {
    const d = new Date(review.created_at)
    const diffMonths =
      (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
    if (diffMonths >= 0 && diffMonths < 12) {
      months[11 - diffMonths].count += 1
    }
  }

  // Recent 5 reviews
  const recentReviews = reviews.slice(0, 5)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-foreground">{t('myDashboard')}</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label={t('totalReviews')}
          value={profile?.review_count ?? reviews.length}
          color="text-indigo-600"
        />
        <StatCard
          label={t('totalHelpful')}
          value={profile?.total_helpful_count ?? 0}
          color="text-purple-600"
        />
        <StatCard label={t('avgRating')} value={avgRating} color="text-amber-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h2 className="text-sm font-semibold text-foreground/80 mb-4">{t('categoryBreakdown')}</h2>
          {categoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [value, '']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-3 space-y-1">
                {categoryData.map((cat, index) => (
                  <li key={cat.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="truncate flex-1">{cat.name}</span>
                    <span className="font-semibold text-foreground">{cat.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Monthly activity */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h2 className="text-sm font-semibold text-foreground/80 mb-4">{t('monthlyActivity')}</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={months} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  cursor={{ fill: '#f5f3ff' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <h2 className="text-sm font-semibold text-foreground/80 mb-4">{t('recentActivity')}</h2>
        {recentReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{currentLocale === 'ko' ? '아직 리뷰가 없습니다' : 'No reviews yet'}</p>
        ) : (
          <ul className="divide-y divide-border">
            {recentReviews.map((review) => (
              <li key={review.id} className="py-3 flex items-start gap-3">
                {/* Rating badge */}
                <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm">
                  {review.overall_rating}
                </span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/${currentLocale}/subject/${review.subject_id}`}
                    className="block text-sm font-medium text-foreground hover:text-indigo-600 truncate transition-colors"
                  >
                    {review.title || review.subjects?.name || 'Review'}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {review.subjects?.name && (
                      <span className="text-muted-foreground">{review.subjects.name} · </span>
                    )}
                    {new Date(review.created_at).toLocaleDateString(
                      currentLocale === 'ko' ? 'ko-KR' : 'en-US',
                      { year: 'numeric', month: 'short', day: 'numeric' }
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
