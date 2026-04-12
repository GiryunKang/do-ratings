// TODO: extract metadata to server component wrapper
'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const { locale } = useParams() as { locale: string }
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError(locale === 'ko' ? '비밀번호는 6자 이상이어야 합니다' : 'Password must be at least 6 characters'); return }
    if (password !== confirm) { setError(locale === 'ko' ? '비밀번호가 일치하지 않습니다' : 'Passwords do not match'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else router.push(`/${locale}/auth/login?reset=success`)
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-xl font-bold text-center mb-6">{locale === 'ko' ? '새 비밀번호 설정' : 'Set New Password'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">{locale === 'ko' ? '새 비밀번호' : 'New Password'}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
            className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="text-sm font-medium">{locale === 'ko' ? '비밀번호 확인' : 'Confirm Password'}</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
            className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full h-9 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/80 disabled:opacity-50">
          {loading ? '...' : (locale === 'ko' ? '비밀번호 변경' : 'Change Password')}
        </button>
      </form>
    </div>
  )
}
