'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  name: Record<string, string>
  slug: string
}

interface AddSubjectModalProps {
  onClose: () => void
  defaultCategorySlug?: string
}

export default function AddSubjectModal({ onClose, defaultCategorySlug }: AddSubjectModalProps) {
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.startsWith('/en') ? 'en' : 'ko'

  const [categories, setCategories] = useState<Category[]>([])
  const [categorySlug, setCategorySlug] = useState(defaultCategorySlug ?? '')
  const [nameKo, setNameKo] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [descKo, setDescKo] = useState('')
  const [descEn, setDescEn] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const isKo = locale === 'ko'

  // Load categories
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('categories').select('id, name, slug').order('slug')
      if (data) {
        setCategories(data)
        if (!categorySlug && data.length > 0) setCategorySlug(data[0].slug)
      }
    }
    load()
  }, [])

  function getCategoryLabel(cat: Category): string {
    return cat.name?.[locale] ?? cat.name?.ko ?? cat.name?.en ?? cat.slug
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameKo && !nameEn) {
      setError(isKo ? '이름을 입력해 주세요.' : 'Please enter a name.')
      return
    }
    if (!categorySlug) {
      setError(isKo ? '카테고리를 선택해 주세요.' : 'Please select a category.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/subjects/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_ko: nameKo || undefined,
          name_en: nameEn || undefined,
          category_slug: categorySlug,
          description_ko: descKo || undefined,
          description_en: descEn || undefined,
          image_url: imageUrl || undefined,
        }),
      })

      if (res.status === 401) {
        setError(isKo ? '로그인이 필요합니다.' : 'You must be logged in.')
        return
      }

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? (isKo ? '추가에 실패했습니다.' : 'Failed to add subject.'))
        return
      }

      const data = await res.json()
      onClose()
      router.push(`/${locale}/subject/${data.id}`)
    } catch {
      setError(isKo ? '네트워크 오류가 발생했습니다.' : 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isKo ? '새 항목 추가' : 'Add New Subject'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isKo ? '카테고리' : 'Category'} <span className="text-red-500">*</span>
            </label>
            <select
              value={categorySlug}
              onChange={e => setCategorySlug(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-background"
            >
              {categories.length === 0 && (
                <option value="">{isKo ? '로딩 중...' : 'Loading...'}</option>
              )}
              {categories.map(cat => (
                <option key={cat.slug} value={cat.slug}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Name Ko */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isKo ? '이름 (한국어)' : 'Name (Korean)'}
              {isKo && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
              type="text"
              value={nameKo}
              onChange={e => setNameKo(e.target.value)}
              placeholder={isKo ? '한국어 이름을 입력하세요' : 'Enter Korean name'}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Name En */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isKo ? '이름 (영어)' : 'Name (English)'}
              {!isKo && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={e => setNameEn(e.target.value)}
              placeholder={isKo ? '영어 이름을 입력하세요 (선택)' : 'Enter English name'}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isKo ? '설명 (선택)' : 'Description (optional)'}
            </label>
            <textarea
              value={isKo ? descKo : descEn}
              onChange={e => isKo ? setDescKo(e.target.value) : setDescEn(e.target.value)}
              placeholder={isKo ? '간단한 설명을 입력하세요' : 'Enter a brief description'}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isKo ? '이미지 URL (선택)' : 'Image URL (optional)'}
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder={isKo ? 'https://... 이미지 주소를 입력하세요' : 'https://... Enter image URL'}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              {isKo
                ? '💡 입력하지 않으면 Wikipedia에서 자동으로 이미지를 가져옵니다. 저작권에 문제없는 이미지만 사용해주세요.'
                : '💡 If left empty, an image will be auto-fetched from Wikipedia. Only use copyright-free images.'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {isKo ? '취소' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading || (!nameKo && !nameEn)}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? (isKo ? '추가 중...' : 'Adding...')
                : (isKo ? '추가하기' : 'Add Subject')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
