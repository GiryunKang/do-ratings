'use client'
import { useState, useEffect } from 'react'

interface Article {
  title: string
  link: string
  pubDate: string
  source: string
}

interface RelatedNewsProps {
  query: string
  locale: string
}

interface RelatedNewsState {
  query: string
  articles: Article[]
}

export default function RelatedNews({ query, locale }: RelatedNewsProps) {
  const [state, setState] = useState<RelatedNewsState>({ query: '', articles: [] })
  const loading = Boolean(query) && state.query !== query
  const articles = state.query === query ? state.articles : []

  useEffect(() => {
    if (!query) {
      return
    }

    let isActive = true

    fetch(`/api/news?q=${encodeURIComponent(query)}&locale=${encodeURIComponent(locale)}`)
      .then(res => res.json())
      .then(data => {
        if (!isActive) {
          return
        }

        setState({ query, articles: data.articles ?? [] })
      })
      .catch(() => {
        if (!isActive) {
          return
        }

        setState({ query, articles: [] })
      })

    return () => {
      isActive = false
    }
  }, [query])

  if (!query) return null
  if (!loading && articles.length === 0) return null

  return (
    <div className="mt-8">
      <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/>
          <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6z"/>
        </svg>
        {locale === 'ko' ? '관련 뉴스' : 'Related News'}
      </h3>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-xl border border-border p-4">
              <div className="skeleton w-3/4 h-4 mb-2" />
              <div className="skeleton w-1/3 h-3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {articles.map((article, i) => (
            <a
              key={i}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h4>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                {article.source && <span className="font-medium text-muted-foreground">{article.source}</span>}
                {article.source && article.pubDate && <span>•</span>}
                {article.pubDate && (
                  <span>{new Date(article.pubDate).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                )}
                <span className="ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
