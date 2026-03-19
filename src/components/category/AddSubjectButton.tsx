'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import AddSubjectModal from '@/components/subject/AddSubjectModal'

interface AddSubjectButtonProps {
  categorySlug: string
  locale: string
}

export default function AddSubjectButton({ categorySlug, locale }: AddSubjectButtonProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
      >
        <span>➕</span> {locale === 'ko' ? '평가 대상 추가' : 'Add Subject'}
      </button>
      {open && (
        <AddSubjectModal
          defaultCategorySlug={categorySlug}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
