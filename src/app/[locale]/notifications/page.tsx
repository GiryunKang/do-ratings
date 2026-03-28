'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { timeAgo } from '@/lib/utils/timeAgo'

interface Notification {
  id: string
  type: 'helpful' | 'comment' | 'follow' | 'achievement' | 'battle'
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

const TYPE_ICON: Record<Notification['type'], string> = {
  helpful: '👍',
  comment: '💬',
  follow: '👤',
  achievement: '🏆',
  battle: '⚔️',
}

const PAGE_SIZE = 20

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const t = useTranslations('notification')
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.startsWith('/en') ? 'en' : 'ko'

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/auth/login`)
    }
  }, [authLoading, user, router, locale])

  const fetchNotifications = useCallback(
    async (currentOffset: number, replace: boolean) => {
      if (!user) return

      const supabase = createClient()
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, link, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + PAGE_SIZE - 1)

      const rows = (data as Notification[]) ?? []

      if (replace) {
        setNotifications(rows)
      } else {
        setNotifications((prev) => [...prev, ...rows])
      }

      setHasMore(rows.length === PAGE_SIZE)
    },
    [user]
  )

  // Initial load
  useEffect(() => {
    if (!user) return

    setLoading(true)
    fetchNotifications(0, true).finally(() => setLoading(false))
  }, [user, fetchNotifications])

  async function handleLoadMore() {
    if (loadingMore || !hasMore) return
    const nextOffset = offset + PAGE_SIZE
    setLoadingMore(true)
    await fetchNotifications(nextOffset, false)
    setOffset(nextOffset)
    setLoadingMore(false)
  }

  async function markAllRead() {
    if (!user) return
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  async function handleNotificationClick(notif: Notification) {
    if (!notif.is_read && user) {
      const supabase = createClient()
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notif.id)

      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      )
    }

    if (notif.link) {
      router.push(notif.link)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="h-7 w-40 bg-muted rounded animate-pulse mb-6" />
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground">{t('notifications')}</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            {t('markAllRead')}
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">{t('noNotifications')}</p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full text-left flex items-start gap-3 px-4 py-4 border-b border-gray-50 last:border-0 hover:bg-muted/50 transition-colors ${
                  !notif.is_read ? 'bg-indigo-50/40' : ''
                }`}
              >
                {/* Type icon */}
                <span className="text-xl shrink-0 mt-0.5 w-8 text-center">
                  {TYPE_ICON[notif.type]}
                </span>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-snug ${
                      !notif.is_read
                        ? 'font-semibold text-foreground'
                        : 'font-normal text-foreground/80'
                    }`}
                  >
                    {notif.title}
                  </p>

                  {notif.body && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                      {notif.body}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">
                    {timeAgo(notif.created_at)}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notif.is_read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
                )}
              </button>
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-sm font-medium px-6 py-2.5 rounded-full border border-border hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Load more'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
