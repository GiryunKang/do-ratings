'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'

interface GalleryImage {
  id: string
  url: string
}

interface ImageGalleryProps {
  images: GalleryImage[]
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const goNext = useCallback(() => {
    setLightboxIndex(prev => (prev === null ? null : (prev + 1) % images.length))
  }, [images.length])

  const goPrev = useCallback(() => {
    setLightboxIndex(prev =>
      prev === null ? null : (prev - 1 + images.length) % images.length
    )
  }, [images.length])

  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [lightboxIndex, goNext, goPrev])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) >= 50) {
      if (diff > 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  if (!images || images.length === 0) return null

  const count = images.length
  const displayed = images.slice(0, Math.min(count, 5))

  return (
    <>
      {/* Grid Display */}
      <div className="w-full">
        {count === 1 && (
          <div className="relative w-full max-h-64 aspect-video rounded-lg overflow-hidden cursor-pointer" onClick={() => openLightbox(0)}>
            <Image
              src={displayed[0].url}
              alt="Review photo"
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, 672px"
              unoptimized
            />
          </div>
        )}

        {count === 2 && (
          <div className="grid grid-cols-2 gap-1">
            {displayed.map((img, i) => (
              <div key={img.id} className="relative h-48 rounded-lg overflow-hidden cursor-pointer" onClick={() => openLightbox(i)}>
                <Image
                  src={img.url}
                  alt={`Review photo ${i + 1}`}
                  fill
                  className="object-cover rounded-lg"
                  sizes="50vw"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}

        {count === 3 && (
          <div className="grid grid-cols-2 gap-1">
            <div className="relative row-span-2 max-h-64 rounded-lg overflow-hidden cursor-pointer" onClick={() => openLightbox(0)}>
              <Image
                src={displayed[0].url}
                alt="Review photo 1"
                fill
                className="object-cover rounded-lg"
                sizes="50vw"
                unoptimized
              />
            </div>
            {displayed.slice(1).map((img, i) => (
              <div key={img.id} className="relative h-32 rounded-lg overflow-hidden cursor-pointer" onClick={() => openLightbox(i + 1)}>
                <Image
                  src={img.url}
                  alt={`Review photo ${i + 2}`}
                  fill
                  className="object-cover rounded-lg"
                  sizes="50vw"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}

        {count >= 4 && (
          <div className="grid grid-cols-2 gap-1">
            {displayed.slice(0, 4).map((img, i) => (
              <div key={img.id} className="relative">
                <div className="relative h-32 rounded-lg overflow-hidden cursor-pointer" onClick={() => openLightbox(i)}>
                  <Image
                    src={img.url}
                    alt={`Review photo ${i + 1}`}
                    fill
                    className="object-cover rounded-lg"
                    sizes="50vw"
                    unoptimized
                  />
                </div>
                {i === 3 && count > 4 && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg cursor-pointer text-white text-2xl font-bold"
                    onClick={() => openLightbox(3)}
                  >
                    +{count - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white text-3xl font-light leading-none z-10 hover:text-muted-foreground/60 transition-colors"
            onClick={(e) => { e.stopPropagation(); closeLightbox() }}
            aria-label="Close"
          >
            ×
          </button>

          {/* Left arrow */}
          {images.length > 1 && (
            <button
              className="absolute left-4 text-white text-4xl font-light z-10 hover:text-muted-foreground/60 transition-colors select-none px-2"
              onClick={(e) => { e.stopPropagation(); goPrev() }}
              aria-label="Previous"
            >
              ‹
            </button>
          )}

          {/* Image */}
          <Image
            src={images[lightboxIndex].url}
            alt={`Photo ${lightboxIndex + 1}`}
            width={1200}
            height={900}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded"
            style={{ width: 'auto', height: 'auto' }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            unoptimized
          />

          {/* Right arrow */}
          {images.length > 1 && (
            <button
              className="absolute right-4 text-white text-4xl font-light z-10 hover:text-muted-foreground/60 transition-colors select-none px-2"
              onClick={(e) => { e.stopPropagation(); goNext() }}
              aria-label="Next"
            >
              ›
            </button>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm opacity-70">
              {lightboxIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
