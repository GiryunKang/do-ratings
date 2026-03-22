'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import CollectionCard from '@/components/collection/CollectionCard'

interface Collection {
  id: string
  title: Record<string, string>
  description: Record<string, string> | null
  subject_count: number
  is_public: boolean
  user_id: string
  created_at: string
}

type Tab = 'mine' | 'public'

interface CreateForm {
  titleKo: string
  titleEn: string
  descKo: string
  descEn: string
  isPublic: boolean
}

const EMPTY_FORM: CreateForm = {
  titleKo: '',
  titleEn: '',
  descKo: '',
  descEn: '',
  isPublic: true,
}

export default function CollectionsPage() {
  const t = useTranslations('collection')
  const tCommon = useTranslations('common')
  const { user, loading: authLoading } = useAuth()
  const pathname = usePathname()
  const locale = pathname.startsWith('/en') ? 'en' : 'ko'

  const [tab, setTab] = useState<Tab>('mine')
  const [myCollections, setMyCollections] = useState<Collection[]>([])
  const [publicCollections, setPublicCollections] = useState<Collection[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchMyCollections = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase
      .from('collections')
      .select('id, title, description, subject_count, is_public, user_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setMyCollections(data ?? [])
  }, [user])

  const fetchPublicCollections = useCallback(async () => {
    const supabase = createClient()
    const query = supabase
      .from('collections')
      .select('id, title, description, subject_count, is_public, user_id, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(40)

    // Exclude own if logged in
    const { data } = user
      ? await query.neq('user_id', user.id)
      : await query
    setPublicCollections(data ?? [])
  }, [user])

  useEffect(() => {
    if (authLoading) return
    setLoadingData(true)
    Promise.all([fetchMyCollections(), fetchPublicCollections()]).finally(() =>
      setLoadingData(false)
    )
  }, [authLoading, fetchMyCollections, fetchPublicCollections])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!form.titleKo.trim() && !form.titleEn.trim()) {
      setFormError(locale === 'ko' ? '제목을 입력하세요' : 'Please enter a title')
      return
    }

    setSubmitting(true)
    setFormError(null)

    const title: Record<string, string> = {}
    if (form.titleKo.trim()) title.ko = form.titleKo.trim()
    if (form.titleEn.trim()) title.en = form.titleEn.trim()

    const description: Record<string, string> = {}
    if (form.descKo.trim()) description.ko = form.descKo.trim()
    if (form.descEn.trim()) description.en = form.descEn.trim()

    try {
      const supabase = createClient()
      const { error } = await supabase.from('collections').insert({
        user_id: user.id,
        title,
        description: Object.keys(description).length > 0 ? description : null,
        is_public: form.isPublic,
      })

      if (error) {
        setFormError(error.message)
        return
      }

      setShowModal(false)
      setForm(EMPTY_FORM)
      await fetchMyCollections()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(collectionId: string) {
    if (!user) return
    const supabase = createClient()
    await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', user.id)
    await fetchMyCollections()
  }

  const activeCollections = tab === 'mine' ? myCollections : publicCollections

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('collections')}</h1>
        {user && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t('createCollection')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('mine')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'mine'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('myCollections')}
          {myCollections.length > 0 && (
            <span className="ml-1.5 bg-indigo-100 text-indigo-700 text-xs rounded-full px-1.5 py-0.5">
              {myCollections.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('public')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'public'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('public')}
          {publicCollections.length > 0 && (
            <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs rounded-full px-1.5 py-0.5">
              {publicCollections.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {loadingData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 h-32 animate-pulse"
            />
          ))}
        </div>
      ) : activeCollections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-indigo-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">{t('noCollections')}</p>
          {tab === 'mine' && user && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-indigo-600 text-sm font-medium hover:underline"
            >
              {t('createCollection')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCollections.map((col) => (
            <CollectionCard
              key={col.id}
              collection={col}
              locale={locale}
              isOwner={user?.id === col.user_id}
              onDelete={
                user?.id === col.user_id
                  ? () => void handleDelete(col.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Create Collection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 z-0"
            onClick={() => {
              setShowModal(false)
              setForm(EMPTY_FORM)
              setFormError(null)
            }}
          />

          {/* Modal */}
          <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {t('createCollection')}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setForm(EMPTY_FORM)
                  setFormError(null)
                }}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  {t('title')}
                </label>
                <input
                  type="text"
                  placeholder="한국어 제목"
                  value={form.titleKo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, titleKo: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-2"
                />
                <input
                  type="text"
                  placeholder="English title"
                  value={form.titleEn}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, titleEn: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  {t('description')}
                </label>
                <textarea
                  placeholder="설명 (선택)"
                  rows={2}
                  value={form.descKo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, descKo: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none mb-2"
                />
                <textarea
                  placeholder="Description (optional)"
                  rows={2}
                  value={form.descEn}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, descEn: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>

              {/* Public/Private toggle */}
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {form.isPublic ? t('public') : t('private')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {form.isPublic
                      ? locale === 'ko'
                        ? '모든 사용자에게 공개됩니다'
                        : 'Visible to everyone'
                      : locale === 'ko'
                      ? '나만 볼 수 있습니다'
                      : 'Only visible to you'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, isPublic: !f.isPublic }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.isPublic ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      form.isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {formError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setForm(EMPTY_FORM)
                    setFormError(null)
                  }}
                  className="flex-1 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? tCommon('loading') : tCommon('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
