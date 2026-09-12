'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'
import { proxyImageUrl } from '@/lib/utils/image-proxy'

/** A failed remote image keeps its space and becomes a neutral subject tile. */
export default function SubjectImage({ src, name, className = '', sizes = '240px', priority = false }: {
  src: string | null | undefined
  name: string
  className?: string
  sizes?: string
  priority?: boolean
}) {
  const url = proxyImageUrl(src ?? null)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  return (
    <div className={`subject-image relative overflow-hidden bg-muted ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center text-secondary" role="img" aria-label={name} aria-hidden={!!url && failedUrl !== url}>
        <span className="font-display text-5xl font-semibold opacity-65" aria-hidden="true">{Array.from(name.trim())[0] ?? '?'}</span>
        <ImageIcon className="absolute bottom-3 right-3 size-4 text-muted-foreground/60" aria-hidden="true" />
      </div>
      {url && failedUrl !== url && (
        <Image src={url} alt={name} fill sizes={sizes} priority={priority} unoptimized
          className="object-cover" onError={() => setFailedUrl(url)} />
      )}
    </div>
  )
}
