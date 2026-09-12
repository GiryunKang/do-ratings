import { Suspense } from 'react'
import AuthForm from '@/components/auth/AuthForm'

export default function Page() {
  return <Suspense fallback={<div className="p-6 text-muted-foreground" role="status">…</div>}><AuthForm mode="signup" /></Suspense>
}
