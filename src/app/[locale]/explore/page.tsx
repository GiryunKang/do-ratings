'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Compass, Plus, RefreshCw, SlidersHorizontal, Star } from 'lucide-react'
import SearchBar from '@/components/search/SearchBar'
import FilterPanel from '@/components/search/FilterPanel'
import AddSubjectModal from '@/components/subject/AddSubjectModal'
import SubjectImage from '@/components/subject/SubjectImage'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { displayRating } from '@/lib/utils/rating'

type Subject = { id: string; name: Record<string, string>; image_url: string | null; avg_rating: number | null; review_count: number; categories: { name: Record<string, string>; slug: string } | null }
type Category = { id: string; name: Record<string, string>; slug: string }
type Filters = { category: string | null; ratingMin: number | null }

export default function ExplorePage() {
  const params = useSearchParams()
  const locale = usePathname().startsWith('/en') ? 'en' : 'ko'
  const ko = locale === 'ko'
  const query = params.get('q') ?? ''
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryError, setCategoryError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [filters, setFilters] = useState<Filters>({ category: null, ratingMin: null })
  const [showFilters, setShowFilters] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  useEffect(() => {
    let cancelled = false
    createClient().from('categories').select('id,name,slug').order('slug').then(({ data, error }) => {
      if (!cancelled) { setCategories(data ?? []); setCategoryError(!!error) }
    })
    return () => { cancelled = true }
  }, [retry])
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError(false)
      const search = new URLSearchParams()
      if (query) search.set('q', query)
      if (filters.category) search.set('category', filters.category)
      if (filters.ratingMin) search.set('rating_min', String(filters.ratingMin))
      try {
        const response = await fetch(`/api/search?${search}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Search failed')
        const data: unknown = await response.json()
        if (!Array.isArray(data)) throw new Error('Invalid results')
        if (!controller.signal.aborted) setSubjects(data)
      } catch {
        if (!controller.signal.aborted) { setError(true); setSubjects([]) }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [query, filters.category, filters.ratingMin, retry])
  const selected = categories.find(category => category.id === filters.category)
  const name = (value: Record<string, string>) => value[locale] || value.ko || value.en || ''
  return <div className="page-pad">
    {showAdd && <AddSubjectModal onClose={() => setShowAdd(false)} defaultCategorySlug={selected?.slug} />}
    <div className="section-heading"><div><p className="mb-2 text-xs font-semibold tracking-[.12em] text-secondary">EXPLORE</p><h1 className="font-display text-3xl">{ko ? '호기심 따라 둘러보기' : 'Follow your curiosity'}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{ko ? '아는 대상을 평가하거나, 다른 사람들의 생각을 살펴보세요.' : 'Rate something you know, or discover how others see it.'}</p></div><Link href={`/${locale}/play`} className="action-link action-secondary"><Compass size={17} />{ko ? '뜻밖의 탐험' : 'Surprise me'}</Link></div>
    <SearchBar key={query} prominent initialQuery={query} className="mb-6 max-w-2xl" />
    <button type="button" aria-expanded={showFilters} aria-controls="explore-filters" onClick={() => setShowFilters(value => !value)} className="action-link action-secondary mb-4 md:hidden"><SlidersHorizontal size={17} />{ko ? '필터 보기' : 'Filters'}{(filters.category || filters.ratingMin) && <span className="text-secondary">({[filters.category, filters.ratingMin].filter(Boolean).length})</span>}</button>
    <div className="flex flex-col gap-6 md:flex-row">
      <div id="explore-filters" className={`${showFilters ? 'block' : 'hidden'} md:block`}><FilterPanel categories={categories} selectedCategory={filters.category} ratingMin={filters.ratingMin} onFilterChange={setFilters} />{categoryError && <div role="alert" className="mt-2 text-sm text-muted-foreground"><p>{ko ? '카테고리 필터를 불러오지 못했어요.' : 'Category filters could not load.'}</p><button type="button" className="action-link underline" onClick={() => setRetry(value => value + 1)}>{ko ? '다시 시도' : 'Try again'}</button></div>}</div>
      <section className="min-w-0 flex-1" aria-label={ko ? '검색 결과' : 'Search results'} aria-busy={loading}>
        <div role="status" className="mb-4 text-sm leading-6 text-muted-foreground">{loading ? (ko ? '대상을 찾고 있어요' : 'Finding topics?') : error ? '' : query ? (ko ? `‘${query}’ 검색 결과 ${subjects.length}개` : `${subjects.length} results for “${query}”`) : (ko ? '둘러볼 대상' : 'Topics to explore')}{!loading && !error && subjects.length === 20 && <p className="text-xs">{ko ? '최대 20개를 보여줍니다. 이름이나 필터로 더 좁혀보세요.' : 'Showing up to 20 topics. Narrow your search with a name or filter.'}</p>}</div>
        {loading ? <div className="grid grid-cols-2 gap-4 xl:grid-cols-3" aria-hidden="true">{[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-52 animate-pulse rounded-xl border border-border bg-muted" />)}</div> : error ? <div role="alert" className="rounded-xl border border-border bg-card p-6"><h2 className="font-semibold">{ko ? '검색 결과를 불러오지 못했어요' : 'Search results could not load'}</h2><p className="mt-2 text-sm text-muted-foreground">{ko ? '잠시 후 다시 시도해주세요. 검색어와 필터는 그대로 유지됩니다.' : 'Please try again. Your search is still here.'}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="action-link action-secondary mt-4"><RefreshCw size={16} />{ko ? '다시 시도' : 'Try again'}</button></div> : subjects.length === 0 ? <div className="rounded-xl border border-border bg-card p-6"><h2 className="font-semibold">{ko ? '일치하는 대상이 없어요' : 'No matching topics'}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{ko ? '다른 이름을 입력하거나 필터를 줄여보세요. 아래에서 새 대상을 제안할 수도 있어요.' : 'Try another name or fewer filters. You can also suggest a topic below.'}</p>{(filters.category || filters.ratingMin) && <button type="button" onClick={() => setFilters({ category: null, ratingMin: null })} className="action-link action-secondary mt-4">{ko ? '필터 지우기' : 'Clear filters'}</button>}</div> : <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">{subjects.map(subject => <Link key={subject.id} href={`/${locale}/subject/${subject.id}`} className="subject-card overflow-hidden rounded-xl border border-border bg-card"><SubjectImage src={subject.image_url} name={name(subject.name)} className="aspect-[4/3]" sizes="(max-width: 767px) 45vw, 220px" /><div className="space-y-2 p-3"><p className="text-xs text-secondary">{subject.categories ? name(subject.categories.name) : ''}</p><h2 className="min-h-10 text-sm font-semibold leading-5 line-clamp-2">{name(subject.name)}</h2><p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">{subject.avg_rating != null && subject.review_count > 0 ? <><Star size={13} className="text-primary" aria-hidden="true" /><strong className="text-foreground">{displayRating(subject.avg_rating)}</strong><span>/10 · {ko ? `리뷰 ${subject.review_count}개` : `${subject.review_count} reviews`}</span></> : <span>{ko ? '첫 평가를 기다려요' : 'Be the first to rate'}</span>}</p></div></Link>)}</div>}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-5"><p className="flex-1 text-sm text-muted-foreground">{ko ? '빠진 대상이 있나요?' : 'Missing a topic?'}</p>{user ? <button type="button" onClick={() => setShowAdd(true)} className="action-link action-secondary"><Plus size={17} />{ko ? '대상 제안' : 'Suggest a topic'}</button> : <Link href={`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/explore${query ? `?q=${encodeURIComponent(query)}` : ''}`)}`} className="action-link action-secondary">{ko ? '로그인하고 제안하기' : 'Sign in to suggest a topic'}</Link>}</div>
      </section>
    </div>
  </div>
}
