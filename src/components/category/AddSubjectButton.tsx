'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

import { useAuth } from '@/lib/hooks/useAuth'
import AddSubjectModal from '@/components/subject/AddSubjectModal'

interface AddSubjectButtonProps {
  categorySlug: string
  locale: string
}

export default function AddSubjectButton({ categorySlug, locale }: AddSubjectButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => user ? setOpen(true) : router.push(`/${locale}/auth/login`)}
        className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" /> {locale === 'ko' ? '평가 대상 추가' : 'Add Subject'}
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
