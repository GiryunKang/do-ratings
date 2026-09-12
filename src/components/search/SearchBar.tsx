'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, LoaderCircle, Search, X } from 'lucide-react'

type Result = { id: string; name: Record<string, string>; categories?: { name: Record<string, string> } | null }

export default function SearchBar({ className = '', prominent = false, initialQuery = '' }: { className?: string; prominent?: boolean; initialQuery?: string }) {
  const router = useRouter()
  const locale = usePathname().startsWith('/en') ? 'en' : 'ko'
  const ko = locale === 'ko'
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [active, setActive] = useState(-1)

  useEffect(() => {
    if (!query.trim() || !open) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(false)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Search failed')
        const data: unknown = await response.json()
        if (!Array.isArray(data)) throw new Error('Invalid results')
        if (!controller.signal.aborted) { setResults(data.slice(0, 6)); setActive(-1) }
      } catch {
        if (!controller.signal.aborted) { setError(true); setResults([]) }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query, open])

  useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const show = open && !!query.trim()
  function search() {
    if (!query.trim()) { input.current?.focus(); return }
    setOpen(false)
    router.push(`/${locale}/explore?q=${encodeURIComponent(query.trim())}`)
  }
  function choose(result: Result) { setOpen(false); router.push(`/${locale}/subject/${result.id}`) }

  return <div ref={root} className={`relative ${className}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <form role="search" aria-label={ko ? '대상 검색' : 'Search topics'} onSubmit={event => { event.preventDefault(); if (show && active >= 0 && results[active]) choose(results[active]); else search() }} className={`flex items-center rounded-xl border bg-card shadow-sm focus-within:border-secondary ${prominent ? 'border-border p-1.5' : 'border-border p-1'}`}>
      <Search size={18} className="ml-3 shrink-0 text-muted-foreground" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">{ko ? '평가할 대상 검색' : 'Search for a topic to rate'}</label>
      <input ref={input} id={id} value={query} type="search" autoComplete="off" placeholder={ko ? '무엇이 궁금한가요?' : 'What are you curious about?'} className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none [&::-webkit-search-cancel-button]:hidden" role="combobox" aria-autocomplete="list" aria-expanded={show} aria-controls={`${id}-list`} aria-activedescendant={show && active >= 0 ? `${id}-option-${active}` : undefined} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); setResults([]); setActive(-1); setError(false); setLoading(!!event.target.value.trim()) }} onKeyDown={event => {
        if (event.key === 'Escape') { setOpen(false); setActive(-1) }
        if (event.key === 'ArrowDown' && results.length) { event.preventDefault(); setOpen(true); setActive(value => (value + 1) % results.length) }
        if (event.key === 'ArrowUp' && results.length) { event.preventDefault(); setOpen(true); setActive(value => value <= 0 ? results.length - 1 : value - 1) }
      }} />
      {query && <button type="button" aria-label={ko ? '검색어 지우기' : 'Clear search'} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" onClick={() => { setQuery(''); setResults([]); setActive(-1); setLoading(false); input.current?.focus() }}><X size={16} /></button>}
      <button type="submit" aria-label={ko ? '검색' : 'Search'} className={`flex h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-lg px-3 text-sm font-semibold ${prominent ? 'bg-primary text-primary-foreground' : 'text-secondary hover:bg-muted'}`}>{prominent ? ko ? '검색' : 'Go' : <ArrowRight size={18} />}</button>
    </form>
    {show && <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-lg">
      <div role="status" className="text-sm text-muted-foreground">{loading ? <p className="flex items-center gap-2 p-3"><LoaderCircle size={16} className="animate-spin" />{ko ? '검색 중' : 'Searching?'}</p> : error ? <p className="p-3">{ko ? '검색을 불러오지 못했어요. 결과 페이지에서 다시 시도해보세요.' : 'Search could not load. Try again on the results page.'}</p> : results.length === 0 ? <p className="p-3">{ko ? '일치하는 대상이 없어요. 다른 이름을 입력해보세요.' : 'No matching topics. Try another name.'}</p> : null}</div>
      <ul id={`${id}-list`} role="listbox" aria-label={ko ? '추천 검색 결과' : 'Suggested results'}>{results.map((result, index) => <li key={result.id} id={`${id}-option-${index}`} role="option" aria-selected={active === index} className={`rounded-lg ${active === index ? 'bg-muted' : ''}`}><button type="button" tabIndex={-1} className="flex min-h-12 w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-muted" onPointerDown={event => event.preventDefault()} onClick={() => choose(result)}><Search size={14} className="shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 text-sm">{result.name[locale] || result.name.ko || result.name.en}</span>{result.categories && <span className="text-xs text-muted-foreground">{result.categories.name[locale] || result.categories.name.ko}</span>}</button></li>)}</ul>
      <button type="button" onClick={search} className="mt-1 flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border-t border-border px-3 text-sm font-semibold text-secondary">{ko ? '검색 결과 모두 보기' : 'See all search results'}<ArrowRight size={16} /></button>
    </div>}
  </div>
}
