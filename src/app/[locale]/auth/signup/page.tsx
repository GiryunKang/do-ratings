'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
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

  const glassWrapperStyle = {
    background: 'linear-gradient(-45deg, #0f0c29, #302b63, #FF6B35, #4ECDC4, #db2777)',
    backgroundSize: '400% 400%',
    animation: 'heroGradientShift 10s ease infinite',
  } as React.CSSProperties

  const glassCardStyle = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  } as React.CSSProperties

  const glassInputStyle = {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
  } as React.CSSProperties

  const glassButtonStyle = {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
  } as React.CSSProperties

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" style={glassWrapperStyle}>
        <div className="w-full max-w-md rounded-xl p-8 shadow-2xl text-center space-y-4" style={glassCardStyle}>
          <div className="w-16 h-16 mx-auto rounded-full bg-green-400/20 flex items-center justify-center">
            <span className="text-3xl">✉️</span>
          </div>
          <h1 className="text-xl font-bold text-white">{t('checkEmail') ?? '이메일을 확인해주세요'}</h1>
          <p className="text-sm text-white/70">
            {t('confirmEmailSent') ?? `${email}로 확인 이메일을 보냈습니다. 이메일의 링크를 클릭하여 가입을 완료해주세요.`}
          </p>
          <p className="text-xs text-white/50">
            {t('checkSpam') ?? '이메일이 보이지 않으면 스팸 폴더를 확인해주세요.'}
          </p>
          <Link href="/auth/login" className="inline-block text-sm text-white hover:text-white/80 mt-2">
            {tc('login')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={glassWrapperStyle}>
      <div className="w-full max-w-md space-y-6 rounded-xl p-8 shadow-2xl" style={glassCardStyle}>
        <h1 className="text-2xl font-bold text-center text-white">{tc('signup')}</h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder={t('nickname')}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-lg p-3 focus:ring-2 focus:ring-white/50 focus:border-transparent focus:outline-none placeholder-white/40 text-white"
            style={glassInputStyle}
            required
          />
          <input
            type="email"
            placeholder={t('email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg p-3 focus:ring-2 focus:ring-white/50 focus:border-transparent focus:outline-none placeholder-white/40 text-white"
            style={glassInputStyle}
            required
          />
          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg p-3 focus:ring-2 focus:ring-white/50 focus:border-transparent focus:outline-none placeholder-white/40 text-white"
            style={glassInputStyle}
            required
            minLength={6}
          />
          {error && <p className="text-red-300 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-primary p-3 text-primary-foreground font-medium hover:bg-primary/80 transition"
          >
            {tc('signup')}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-white/60">{t('orContinueWith')}</span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleOAuth('google')}
            className="w-full rounded-lg p-3 transition text-white font-medium flex items-center justify-center gap-2"
            style={glassButtonStyle}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {t('signupWith', { provider: 'Google' })}
          </button>
          <button
            onClick={() => handleOAuth('kakao')}
            className="w-full rounded-lg p-3 transition font-medium"
            style={{ backgroundColor: '#FEE500', color: '#000' }}
          >
            💬 {t('signupWith', { provider: 'Kakao' })}
          </button>
          <button
            onClick={() => handleOAuth('apple')}
            className="w-full rounded-lg p-3 transition text-white font-medium"
            style={glassButtonStyle}
          >
             {t('signupWith', { provider: 'Apple' })}
          </button>
        </div>

        <p className="text-center text-sm text-white/60">
          <Link href="/auth/login" className="text-white hover:text-white/80">
            {tc('login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
