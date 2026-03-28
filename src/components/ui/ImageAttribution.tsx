'use client'

interface ImageAttributionProps {
  attribution: {
    source: string          // 'Google' | 'Wikipedia' | 'Unsplash'
    photographer?: string   // photographer or contributor name
    url?: string           // link to source
    license?: string       // e.g. 'CC BY-SA 3.0'
  }
}

export default function ImageAttribution({ attribution }: ImageAttributionProps) {
  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {attribution.url ? (
        <a href={attribution.url} target="_blank" rel="noopener noreferrer" className="hover:text-muted-foreground hover:underline">
          {attribution.photographer ? `${attribution.photographer} · ${attribution.source}` : attribution.source}
        </a>
      ) : (
        <span>
          {attribution.photographer ? `${attribution.photographer} · ${attribution.source}` : attribution.source}
        </span>
      )}
      {attribution.license && (
        <span className="text-muted-foreground/60">({attribution.license})</span>
      )}
    </div>
  )
}
