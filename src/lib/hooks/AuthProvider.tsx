'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    let authChanged = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      authChanged = true
      setUser(session?.user ?? null)
      setLoading(false)
    })
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || authChanged) return
      setUser(data.user)
      setLoading(false)
    }).catch(() => {
      if (!cancelled && !authChanged) { setUser(null); setLoading(false) }
    })
    return () => { cancelled = true; subscription.unsubscribe() }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
