'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { safeReturnTo } from '@/lib/utils/return-to'
import { claimPendingGuestDraft } from '@/lib/utils/draft'

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const pathname = usePathname()
  const locale = pathname.startsWith('/en') ? 'en' : 'ko'
  const ko = locale === 'ko'
  const signup = mode === 'signup'
  const params = useSearchParams()
  const destination = safeReturnTo(params.get('redirect'), locale)
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState(params.has('error') ? (ko ? '로그인을 완료하지 못했어요. 다시 시도해주세요.' : 'Sign-in could not be completed. Please try again.') : '')
  const [busy, setBusy] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const callback = () => `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(destination)}`
  const authLink = (page: string) => `/${locale}/auth/${page}?redirect=${encodeURIComponent(destination)}`

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const supabase = createClient()
      if (signup) {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nickname }, emailRedirectTo: callback() } })
        if (error) throw error
        if (!data.session) { setEmailSent(true); return }
        claimPendingGuestDraft(data.session.user.id)
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        claimPendingGuestDraft(data.user.id)
      }
      router.push(destination)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : ko ? '요청을 완료하지 못했어요. 다시 시도해주세요.' : 'Unable to complete the request. Please try again.')
    } finally { setBusy(false) }
  }

  async function oauth(provider: 'google' | 'apple' | 'kakao') {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const { error } = await createClient().auth.signInWithOAuth({ provider, options: { redirectTo: callback() } })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : ko ? '로그인을 시작하지 못했어요.' : 'Unable to start sign-in.')
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-8 space-y-6">
        {emailSent ? <>
          <h1 className="text-2xl font-bold">{ko ? '이메일을 확인해주세요' : 'Check your email'}</h1>
          <p role="status" className="text-sm leading-relaxed text-muted-foreground">{ko ? '가입 확인 링크를 보냈어요. 이메일의 링크를 열어 가입을 완료한 뒤 이 탭으로 돌아와 이어 쓰세요.' : 'We sent a confirmation link. Complete sign-up, then return to this tab to continue your draft.'}</p>
          <Link href={authLink('login')} className="inline-flex min-h-11 items-center font-semibold text-primary">{ko ? '로그인으로 돌아가기' : 'Return to sign-in'}</Link>
        </> : <>
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wider text-primary">DO! RATINGS!</p>
            <h1 className="text-2xl font-bold">{signup ? (ko ? '나만의 평가 기록 시작하기' : 'Start your review collection') : (ko ? '다시 만나 반가워요' : 'Welcome back')}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{destination.includes('/write/') ? (ko ? '로그인하면 작성하던 리뷰로 돌아갑니다.' : 'Sign in to return to your review.') : (ko ? '직접 경험한 것들을 솔직하게 기록하세요.' : 'Keep an honest record of your experiences.')}</p>
          </div>
          <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
            {signup && <div className="space-y-2"><label htmlFor="auth-nickname" className="text-sm font-medium">{ko ? '닉네임' : 'Nickname'}</label><input id="auth-nickname" value={nickname} onChange={e => setNickname(e.target.value)} required maxLength={50} autoComplete="nickname" disabled={busy} className="w-full min-h-11 rounded-xl border border-border bg-background px-3 py-3 text-base" /></div>}
            <div className="space-y-2"><label htmlFor="auth-email" className="text-sm font-medium">{ko ? '이메일' : 'Email'}</label><input id="auth-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" disabled={busy} className="w-full min-h-11 rounded-xl border border-border bg-background px-3 py-3 text-base" /></div>
            <div className="space-y-2"><label htmlFor="auth-password" className="text-sm font-medium">{ko ? '비밀번호' : 'Password'}</label><input id="auth-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={signup ? 6 : undefined} autoComplete={signup ? 'new-password' : 'current-password'} disabled={busy} className="w-full min-h-11 rounded-xl border border-border bg-background px-3 py-3 text-base" /></div>
            {error && <p role="alert" className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
            {!signup && <Link href={`/${locale}/auth/forgot-password`} className="inline-flex min-h-11 items-center text-sm text-muted-foreground">{ko ? '비밀번호를 잊으셨나요?' : 'Forgot password?'}</Link>}
            <button type="submit" disabled={busy} className="w-full min-h-11 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">{busy ? (ko ? '처리 중…' : 'Please wait…') : signup ? (ko ? '회원가입' : 'Sign up') : (ko ? '로그인' : 'Sign in')}</button>
          </form>
          <div className="space-y-3 border-t border-border pt-5">
            <p className="text-center text-xs text-muted-foreground">{ko ? '다른 계정으로 계속하기' : 'Or continue with'}</p>
            <div className="grid grid-cols-1 gap-2">
              {(['google', 'kakao', 'apple'] as const).map(provider => <button key={provider} type="button" disabled={busy} onClick={() => oauth(provider)} className="min-h-11 rounded-xl border border-border bg-background px-3 py-3 text-sm font-medium capitalize hover:bg-muted disabled:opacity-60">{provider}</button>)}
            </div>
          </div>
          <Link href={authLink(signup ? 'login' : 'signup')} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">{signup ? (ko ? '이미 계정이 있어요' : 'I already have an account') : (ko ? '처음이신가요? 회원가입' : 'New here? Create an account')}</Link>
        </>}
      </section>
    </div>
  )
}
