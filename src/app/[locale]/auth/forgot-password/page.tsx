'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const { locale } = useParams() as { locale: string }
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
          <span className="text-3xl">✉️</span>
        </div>
        <h1 className="text-xl font-bold mb-2">{locale === 'ko' ? '이메일을 확인해주세요' : 'Check your email'}</h1>
        <p className="text-sm text-muted-foreground mb-4">{locale === 'ko' ? '비밀번호 재설정 링크를 보냈습니다.' : 'We sent you a password reset link.'}</p>
        <Link href={`/${locale}/auth/login`} className="text-sm text-primary hover:underline">
          {locale === 'ko' ? '로그인으로 돌아가기' : 'Back to login'}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-xl font-bold text-center mb-6">{locale === 'ko' ? '비밀번호 재설정' : 'Reset Password'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">{locale === 'ko' ? '이메일' : 'Email'}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full h-9 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/80 disabled:opacity-50">
          {loading ? (locale === 'ko' ? '전송 중...' : 'Sending...') : (locale === 'ko' ? '재설정 링크 보내기' : 'Send Reset Link')}
        </button>
      </form>
      <p className="text-center mt-4">
        <Link href={`/${locale}/auth/login`} className="text-sm text-primary hover:underline">
          {locale === 'ko' ? '로그인으로 돌아가기' : 'Back to login'}
        </Link>
      </p>
    </div>
  )
}
