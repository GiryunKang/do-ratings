'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers: number
  totalReviews: number
  totalSubjects: number
  pendingReports: number
  pendingClaims: number
}

interface Report {
  id: string
  reason: string
  description: string | null
  status: string
  created_at: string
  reporter_id: string
  review_id: string
  reviews: {
    title: string | null
  } | null
  reporter: {
    nickname: string | null
  } | null
}

interface BusinessClaim {
  id: string
  business_name: string
  business_email: string
  verification_status: string
  created_at: string
  subjects: {
    name: string
  } | null
}

type Tab = 'stats' | 'reports' | 'claims'

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const t = useTranslations('admin')
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const currentLocale = pathname.startsWith('/en') ? 'en' : 'ko'

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('stats')
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalReviews: 0,
    totalSubjects: 0,
    pendingReports: 0,
    pendingClaims: 0,
  })
  const [reports, setReports] = useState<Report[]>([])
  const [claims, setClaims] = useState<BusinessClaim[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── Check admin ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return

    async function checkAdmin() {
      const supabase = createClient()
      const { data } = await supabase
        .from('public_profiles')
        .select('is_admin')
        .eq('id', user!.id)
        .single()

      setIsAdmin(data?.is_admin === true)
    }

    void checkAdmin()
  }, [user])

  // ── Fetch data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return

    async function fetchData() {
      const supabase = createClient()

      const [
        { count: usersCount, error: usersError },
        { count: reviewsCount, error: reviewsError },
        { count: subjectsCount, error: subjectsError },
        { data: pendingReportsData, error: reportsError },
        { data: pendingClaimsData, error: claimsError },
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase
          .from('reports')
          .select('*, reviews(title), reporter:reporter_id(nickname)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('business_claims')
          .select('*, subjects(name)')
          .eq('verification_status', 'pending')
          .order('created_at', { ascending: false }),
      ])
      const queryErrors = [usersError, reviewsError, subjectsError, reportsError, claimsError].filter(Boolean)
      if (queryErrors.length > 0) {
        console.error('[AdminPage] query errors:', queryErrors.map(e => e!.message))
      }

      setStats({
        totalUsers: usersCount ?? 0,
        totalReviews: reviewsCount ?? 0,
        totalSubjects: subjectsCount ?? 0,
        pendingReports: pendingReportsData?.length ?? 0,
        pendingClaims: pendingClaimsData?.length ?? 0,
      })
      setReports((pendingReportsData as unknown as Report[]) ?? [])
      setClaims((pendingClaimsData as unknown as BusinessClaim[]) ?? [])
      setDataLoading(false)
    }

    void fetchData()
  }, [isAdmin])

  // ── Report action ────────────────────────────────────────────────────────────
  async function handleReportAction(reportId: string, newStatus: 'resolved' | 'dismissed') {
    setActionLoading(reportId)
    const supabase = createClient()
    await supabase.from('reports').update({ status: newStatus }).eq('id', reportId)
    setReports((prev) => prev.filter((r) => r.id !== reportId))
    setStats((prev) => ({ ...prev, pendingReports: Math.max(0, prev.pendingReports - 1) }))
    setActionLoading(null)
  }

  // ── Claim action ─────────────────────────────────────────────────────────────
  async function handleClaimAction(claimId: string, newStatus: 'approved' | 'rejected') {
    setActionLoading(claimId)
    const supabase = createClient()
    await supabase
      .from('business_claims')
      .update({ verification_status: newStatus })
      .eq('id', claimId)
    setClaims((prev) => prev.filter((c) => c.id !== claimId))
    setStats((prev) => ({ ...prev, pendingClaims: Math.max(0, prev.pendingClaims - 1) }))
    setActionLoading(null)
  }

  // ── Loading states ───────────────────────────────────────────────────────────
  if (loading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary/40 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground mb-2">Access Denied</p>
          <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary/40 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'stats', label: t('stats') },
    { key: 'reports', label: t('reports') },
    { key: 'claims', label: t('claims') },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t('dashboard')}</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Stats ── */}
      {tab === 'stats' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label={t('totalUsers')} value={stats.totalUsers} color="text-primary" />
          <StatCard label={t('totalReviews')} value={stats.totalReviews} color="text-primary" />
          <StatCard
            label={t('totalSubjects')}
            value={stats.totalSubjects}
            color="text-amber-600"
          />
          <StatCard
            label={t('pendingReports')}
            value={stats.pendingReports}
            color="text-red-600"
          />
        </div>
      )}

      {/* ── Reports ── */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
              <p className="text-sm text-muted-foreground">No pending reports</p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col sm:flex-row sm:items-start gap-3"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-700 capitalize">
                      {report.reason}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString(
                        currentLocale === 'ko' ? 'ko-KR' : 'en-US',
                        { year: 'numeric', month: 'short', day: 'numeric' }
                      )}
                    </span>
                  </div>
                  {report.reviews?.title && (
                    <p className="text-sm font-medium text-foreground truncate">
                      {report.reviews.title}
                    </p>
                  )}
                  {report.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{report.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Reporter: {report.reporter?.nickname ?? report.reporter_id}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleReportAction(report.id, 'resolved')}
                    disabled={actionLoading === report.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
                  >
                    {t('resolve')}
                  </button>
                  <button
                    onClick={() => handleReportAction(report.id, 'dismissed')}
                    disabled={actionLoading === report.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    {t('dismiss')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Business Claims ── */}
      {tab === 'claims' && (
        <div className="space-y-3">
          {claims.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
              <p className="text-sm text-muted-foreground">No pending claims</p>
            </div>
          ) : (
            claims.map((claim) => (
              <div
                key={claim.id}
                className="bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col sm:flex-row sm:items-start gap-3"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {claim.business_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{claim.business_email}</p>
                  {claim.subjects?.name && (
                    <p className="text-xs text-muted-foreground">Subject: {claim.subjects.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(claim.created_at).toLocaleDateString(
                      currentLocale === 'ko' ? 'ko-KR' : 'en-US',
                      { year: 'numeric', month: 'short', day: 'numeric' }
                    )}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleClaimAction(claim.id, 'approved')}
                    disabled={actionLoading === claim.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/5 dark:bg-primary/10 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 disabled:opacity-50 transition-colors"
                  >
                    {t('approve')}
                  </button>
                  <button
                    onClick={() => handleClaimAction(claim.id, 'rejected')}
                    disabled={actionLoading === claim.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                  >
                    {t('reject')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
