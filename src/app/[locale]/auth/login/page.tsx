'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  async function handleOAuth(provider: 'google' | 'apple' | 'kakao') {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-center">{tc('login')}</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder={t('email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border p-3 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border p-3 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
              {t('forgotPassword') ?? '비밀번호를 잊으셨나요?'}
            </Link>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary p-3 text-primary-foreground font-medium hover:bg-primary/80 transition"
          >
            {tc('login')}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-2 text-muted-foreground">{t('orContinueWith')}</span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleOAuth('google')}
            className="w-full rounded-lg border border-border p-3 hover:bg-muted transition"
          >
            {t('loginWith', { provider: 'Google' })}
          </button>
          <button
            onClick={() => handleOAuth('kakao')}
            className="w-full rounded-lg border border-border p-3 hover:bg-muted transition"
          >
            {t('loginWith', { provider: 'Kakao' })}
          </button>
          <button
            onClick={() => handleOAuth('apple')}
            className="w-full rounded-lg border border-border p-3 hover:bg-muted transition"
          >
            {t('loginWith', { provider: 'Apple' })}
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/auth/signup" className="text-primary hover:underline">
            {tc('signup')}
          </Link>
        </p>
      </div>
    </div>
  )
}
