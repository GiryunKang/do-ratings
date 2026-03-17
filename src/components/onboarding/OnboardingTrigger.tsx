'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import OnboardingModal from './OnboardingModal'

export default function OnboardingTrigger() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const locale = pathname.startsWith('/en') ? 'en' : 'ko'
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (loading || !user) return

    // Check if user has completed onboarding
    const completed = localStorage.getItem('onboarding_completed')
    if (!completed) {
      // Small delay so layout renders first
      const timer = setTimeout(() => setShowOnboarding(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [user, loading])

  function handleComplete() {
    localStorage.setItem('onboarding_completed', 'true')
    setShowOnboarding(false)
  }

  if (!showOnboarding) return null

  return <OnboardingModal locale={locale} onComplete={handleComplete} />
}
