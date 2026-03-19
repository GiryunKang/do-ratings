'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const t = useTranslations('common')
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = pathname.startsWith('/en') ? 'en' : 'ko'

  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [language, setLanguage] = useState<'ko' | 'en'>(currentLocale as 'ko' | 'en')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/${currentLocale}/auth/login`)
    }
  }, [user, loading, router, currentLocale])

  // Populate form with current user data
  useEffect(() => {
    if (user) {
      setNickname(
        user.user_metadata?.nickname || user.user_metadata?.name || user.email?.split('@')[0] || ''
      )
      setAvatarUrl(user.user_metadata?.avatar_url || '')
    }
  }, [user])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    try {
      const supabase = createClient()

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { nickname: nickname.trim(), avatar_url: avatarUrl.trim() },
      })
      if (authError) throw authError

      // Update users table
      const { error: dbError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          nickname: nickname.trim(),
          avatar_url: avatarUrl.trim(),
          language_preference: language,
        })
      if (dbError) throw dbError

      // If language changed, navigate to the new locale
      if (language !== currentLocale) {
        router.push(`/${language}/settings`)
        return
      }

      showToast('success', t('saveSuccess') ?? 'Settings saved!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      showToast('error', msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.type === 'success' ? '✓ ' : '✕ '}
          {toast.message}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {t('settings') ?? 'Settings'}
      </h1>

      <form onSubmit={handleSave} className="space-y-6 bg-white rounded-2xl border border-gray-200 p-6">
        {/* Nickname */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('nickname') ?? 'Nickname'}
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={30}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            placeholder={t('nicknamePlaceholder') ?? 'Enter nickname'}
          />
        </div>

        {/* Avatar URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('avatarUrl') ?? 'Avatar URL'}
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            placeholder="https://example.com/avatar.png"
          />
          {avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Avatar preview"
              className="mt-3 w-16 h-16 rounded-full object-cover border border-gray-200"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('language') ?? 'Language'}
          </label>
          <div className="flex gap-3">
            {(['ko', 'en'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  language === lang
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                }`}
              >
                {lang === 'ko' ? '한국어' : 'English'}
              </button>
            ))}
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('email') ?? 'Email'}
          </label>
          <input
            type="email"
            value={user.email ?? ''}
            readOnly
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {saving ? (t('saving') ?? 'Saving...') : (t('save') ?? 'Save Changes')}
        </button>
      </form>

      {/* Account Deletion */}
      <div className="mt-8 pt-6 border-t border-red-200">
        <h3 className="text-sm font-semibold text-red-600 mb-2">
          {locale === 'ko' ? '위험 구역' : 'Danger Zone'}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {locale === 'ko'
            ? '계정을 삭제하면 모든 리뷰, 댓글, 활동 내역이 영구적으로 삭제되며 복구할 수 없습니다.'
            : 'Deleting your account will permanently remove all reviews, comments, and activity. This cannot be undone.'}
        </p>
        <button
          type="button"
          onClick={async () => {
            const msg = locale === 'ko'
              ? '정말로 계정을 삭제하시겠습니까? 모든 데이터가 영구 삭제됩니다.'
              : 'Are you sure you want to delete your account? All data will be permanently deleted.'
            if (!window.confirm(msg)) return
            const secondMsg = locale === 'ko'
              ? '마지막 확인: 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?'
              : 'Final confirmation: This action cannot be undone. Continue?'
            if (!window.confirm(secondMsg)) return
            try {
              const res = await fetch('/api/account/delete', { method: 'DELETE' })
              if (res.ok) {
                window.location.href = '/'
              } else {
                alert(locale === 'ko' ? '계정 삭제에 실패했습니다.' : 'Failed to delete account.')
              }
            } catch {
              alert(locale === 'ko' ? '오류가 발생했습니다.' : 'An error occurred.')
            }
          }}
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
        >
          {locale === 'ko' ? '계정 영구 삭제' : 'Delete Account Permanently'}
        </button>
      </div>
    </div>
  )
}
