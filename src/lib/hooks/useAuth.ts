'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isActive = true
    const supabase = createClient()

    async function syncUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!isActive) {
        return
      }

      setUser(currentUser ?? null)
      setLoading(false)
    }

    void syncUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) {
        return
      }

      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}
