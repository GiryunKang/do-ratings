'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import CompareCard from '@/components/compare/CompareCard'
import SubjectPicker from '@/components/compare/SubjectPicker'

interface CompareSubject {
  id: string
  name: Record<string, string>
  image_url: string | null
  avg_rating: number | null
  review_count: number
  category_id: string
}

interface SubjectData {
  subject: CompareSubject
  criteria: Array<{ key: string; ko: string; en: string }>
  avgSubRatings: Record<string, number>
}

async function fetchSubRatings(subjectId: string): Promise<Record<string, number>> {
  const supabase = createClient()
  const { data: reviews } = await supabase
    .from('reviews')
    .select('sub_ratings')
    .eq('subject_id', subjectId)

  const sums: Record<string, number> = {}
  const counts: Record<string, number> = {}
  for (const review of reviews ?? []) {
    const sr = review.sub_ratings as Record<string, number> | null
    if (!sr) continue
    for (const [key, val] of Object.entries(sr)) {
      sums[key] = (sums[key] ?? 0) + val
      counts[key] = (counts[key] ?? 0) + 1
    }
  }
  const avg: Record<string, number> = {}
  for (const key of Object.keys(sums)) {
    avg[key] = Math.round((sums[key] / counts[key]) * 10) / 10
  }
  return avg
}

async function fetchSubjectData(id: string): Promise<SubjectData | null> {
  const supabase = createClient()

  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('id, name, image_url, avg_rating, review_count, category_id')
    .eq('id', id)
    .single()

  if (subjectError || !subject) return null

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('sub_rating_criteria')
    .eq('id', subject.category_id)
    .single()

  const criteria: Array<{ key: string; ko: string; en: string }> =
    !categoryError && category?.sub_rating_criteria
      ? (category.sub_rating_criteria as Array<{ key: string; ko: string; en: string }>)
      : []

  const avgSubRatings = await fetchSubRatings(id)

  return {
    subject: subject as CompareSubject,
    criteria,
    avgSubRatings,
  }
}

function computeHighlights(subjectsData: SubjectData[]): Map<string, string[]> {
  const highlights = new Map<string, string[]>()
  const allKeys = new Set<string>()
  subjectsData.forEach(sd => sd.criteria.forEach(c => allKeys.add(c.key)))

  for (const key of allKeys) {
    let maxVal = -1
    let winnerId = ''
    for (const sd of subjectsData) {
      const val = sd.avgSubRatings[key] ?? 0
      if (val > maxVal) { maxVal = val; winnerId = sd.subject.id }
    }
    if (winnerId && maxVal > 0) {
      const existing = highlights.get(winnerId) ?? []
      existing.push(key)
      highlights.set(winnerId, existing)
    }
  }
  return highlights
}

function ComparePageInner() {
  const t = useTranslations('compare')
  const searchParams = useSearchParams()
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? 'ko'

  const [subjects, setSubjects] = useState<CompareSubject[]>([])
  const [subjectsData, setSubjectsData] = useState<SubjectData[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Load subjects from URL on mount
  useEffect(() => {
    const ids = searchParams.get('ids')
    if (!ids) return

    const idList = ids.split(',').filter(Boolean).slice(0, 3)
    if (idList.length === 0) return

    setLoading(true)
    Promise.all(idList.map(fetchSubjectData))
      .then(results => {
        const valid = results.filter((r): r is SubjectData => r !== null)
        setSubjectsData(valid)
        const validSubjects = valid.map(sd => sd.subject)
        setSubjects(validSubjects)
        if (validSubjects.length > 0 && !categoryId) {
          setCategoryId(validSubjects[0].category_id)
        }
      })
      .finally(() => setLoading(false))
    // Only run on mount when searchParams change (not on categoryId change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Update URL when subjects change (but not on initial mount from URL)
  const updateUrl = useCallback((newSubjects: CompareSubject[]) => {
    const newIds = newSubjects.map(s => s.id).join(',')
    router.replace(`/${locale}/compare${newIds ? `?ids=${newIds}` : ''}`)
  }, [locale, router])

  function handleAddSubject(subject: CompareSubject) {
    if (!categoryId) setCategoryId(subject.category_id)

    const newSubjects = [...subjects, subject]
    setSubjects(newSubjects)
    updateUrl(newSubjects)

    // Fetch data for new subject
    setLoading(true)
    fetchSubjectData(subject.id)
      .then(data => {
        if (data) {
          setSubjectsData(prev => [...prev, data])
        }
      })
      .finally(() => setLoading(false))
  }

  function handleRemoveSubject(subjectId: string) {
    const newSubjects = subjects.filter(s => s.id !== subjectId)
    setSubjects(newSubjects)
    setSubjectsData(prev => prev.filter(sd => sd.subject.id !== subjectId))
    if (newSubjects.length === 0) setCategoryId(null)
    updateUrl(newSubjects)
  }

  const highlights = computeHighlights(subjectsData)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-5">{t('title')}</h1>

      {loading && subjectsData.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <svg
            className="animate-spin h-6 w-6 text-indigo-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : subjectsData.length > 0 ? (
        <div
          className={`grid gap-4 ${
            subjectsData.length === 1
              ? 'grid-cols-1 max-w-sm'
              : subjectsData.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2 md:grid-cols-3'
          }`}
        >
          {subjectsData.map(sd => (
            <CompareCard
              key={sd.subject.id}
              subject={sd.subject}
              criteria={sd.criteria}
              avgSubRatings={sd.avgSubRatings}
              highlightKeys={highlights.get(sd.subject.id) ?? []}
              locale={locale}
              onRemove={() => handleRemoveSubject(sd.subject.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 mb-4">{t('noSubjects')}</p>
        </div>
      )}

      {subjectsData.length < 3 && (
        <button
          onClick={() => setPickerOpen(true)}
          className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
        >
          + {t('addSubject')}
        </button>
      )}

      {pickerOpen && (
        <SubjectPicker
          categoryId={categoryId}
          locale={locale}
          onSelect={handleAddSubject}
          onClose={() => setPickerOpen(false)}
          excludeIds={subjectsData.map(sd => sd.subject.id)}
        />
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-16">
            <svg
              className="animate-spin h-6 w-6 text-indigo-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        </div>
      }
    >
      <ComparePageInner />
    </Suspense>
  )
}
