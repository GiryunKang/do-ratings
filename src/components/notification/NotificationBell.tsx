'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { timeAgo } from '@/lib/utils/timeAgo'

interface NotificationBellProps {
  userId: string | null
}

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

const PAGE_SIZE = 10

export default function NotificationBell({ userId }: NotificationBellProps) {
  const t = useTranslations('notification')
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.startsWith('/en') ? 'en' : 'ko'

  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loadingList, setLoadingList] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch unread count on mount
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    async function fetchUnreadCount() {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .eq('is_read', false)

      setUnreadCount(count ?? 0)
    }

    void fetchUnreadCount()

    // Realtime subscription for new notifications
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          setUnreadCount((c) => c + 1)
          setNotifications((prev) => [newNotif, ...prev])
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  // Close on outside click
  useEffect(() => {
    if (!open) return

    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Fetch notifications when dropdown opens
  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    setLoadingList(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, body, link, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    setNotifications((data as Notification[]) ?? [])
    setLoadingList(false)
  }, [userId])

  function toggleDropdown() {
    if (!open) {
      void fetchNotifications()
    }
    setOpen((v) => !v)
  }

  async function markAllRead() {
    if (!userId) return
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  async function handleNotificationClick(notif: Notification) {
    if (!notif.is_read && userId) {
      const supabase = createClient()
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notif.id)

      setUnreadCount((c) => Math.max(0, c - 1))
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      )
    }

    setOpen(false)

    if (notif.link) {
      router.push(notif.link)
    }
  }

  if (!userId) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
        aria-label={t('notifications')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">
              {t('notifications')}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                {t('markAllRead')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loadingList ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                {t('noNotifications')}
              </div>
            ) : (
              <ul>
                {notifications.map((notif) => (
                  <li key={notif.id}>
                    <button
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                        !notif.is_read ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {/* Type icon */}
                      <span className="text-lg shrink-0 mt-0.5">
                        {TYPE_ICON[notif.type]}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-snug truncate ${
                            !notif.is_read
                              ? 'font-semibold text-gray-900'
                              : 'font-normal text-gray-600'
                          }`}
                        >
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {timeAgo(notif.created_at)}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer — link to full page */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <button
              onClick={() => {
                setOpen(false)
                router.push(`/${locale}/notifications`)
              }}
              className="w-full text-center text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              {t('notifications')} &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
