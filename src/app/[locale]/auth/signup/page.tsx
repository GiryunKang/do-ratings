'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    })
    if (error) {
      setError(error.message)
    } else {
      setEmailSent(true)
    }
  }

  async function handleOAuth(provider: 'google' | 'apple' | 'kakao') {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl bg-card p-8 shadow-lg text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-3xl">✉️</span>
          </div>
          <h1 className="text-xl font-bold">{t('checkEmail') ?? '이메일을 확인해주세요'}</h1>
          <p className="text-sm text-muted-foreground">
            {t('confirmEmailSent') ?? `${email}로 확인 이메일을 보냈습니다. 이메일의 링크를 클릭하여 가입을 완료해주세요.`}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('checkSpam') ?? '이메일이 보이지 않으면 스팸 폴더를 확인해주세요.'}
          </p>
          <Link href="/auth/login" className="inline-block text-sm text-primary hover:underline mt-2">
            {tc('login')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-center">{tc('signup')}</h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder={t('nickname')}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-lg border border-border p-3 focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none"
            required
          />
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
            minLength={6}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-primary p-3 text-primary-foreground font-medium hover:bg-primary/80 transition"
          >
            {tc('signup')}
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
            {t('signupWith', { provider: 'Google' })}
          </button>
          <button
            onClick={() => handleOAuth('kakao')}
            className="w-full rounded-lg border border-border p-3 hover:bg-muted transition"
          >
            {t('signupWith', { provider: 'Kakao' })}
          </button>
          <button
            onClick={() => handleOAuth('apple')}
            className="w-full rounded-lg border border-border p-3 hover:bg-muted transition"
          >
            {t('signupWith', { provider: 'Apple' })}
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/auth/login" className="text-primary hover:underline">
            {tc('login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
