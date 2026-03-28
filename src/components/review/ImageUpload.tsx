'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import imageCompression from 'browser-image-compression'

export interface ImageFile {
  id: string
  file: File
  previewUrl: string
}

interface ImageUploadProps {
  images: ImageFile[]
  onChange: (images: ImageFile[]) => void
  maxImages?: number
  disabled?: boolean
}

const COMPRESSION_OPTIONS = {
  maxWidthOrHeight: 1200,
  maxSizeMB: 1,
  useWebWorker: true,
  fileType: 'image/webp' as const,
}

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp'

export default function ImageUpload({
  images,
  onChange,
  maxImages = 5,
  disabled = false,
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const remaining = maxImages - images.length
      if (remaining <= 0) return

      const toProcess = fileArray.slice(0, remaining)
      setCompressing(true)

      try {
        const newImages: ImageFile[] = await Promise.all(
          toProcess.map(async (file) => {
            const compressed = await imageCompression(file, COMPRESSION_OPTIONS)
            const previewUrl = URL.createObjectURL(compressed)
            return {
              id: crypto.randomUUID(),
              file: compressed,
              previewUrl,
            }
          })
        )
        onChange([...images, ...newImages])
      } finally {
        setCompressing(false)
      }
    },
    [images, maxImages, onChange]
  )

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
      // Reset so the same file can be re-selected
      e.target.value = ''
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled || compressing) return
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (!disabled && !compressing) setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
  }

  function handleRemove(id: string) {
    const removed = images.find((img) => img.id === id)
    if (removed) URL.revokeObjectURL(removed.previewUrl)
    onChange(images.filter((img) => img.id !== id))
  }

  const canAdd = images.length < maxImages && !disabled

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={[
          'relative border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center justify-center gap-2 transition-colors',
          isDragOver && canAdd
            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
            : 'border-border bg-muted/50',
          !canAdd ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        {/* Compressing overlay */}
        {compressing && (
          <div className="absolute inset-0 rounded-xl bg-card/70 flex items-center justify-center z-10">
            <span className="text-sm text-indigo-600 font-medium animate-pulse">
              Compressing…
            </span>
          </div>
        )}

        <svg
          className="w-8 h-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>

        <p className="text-sm text-muted-foreground text-center">
          Drag &amp; drop photos here, or{' '}
          <button
            type="button"
            disabled={!canAdd || compressing}
            onClick={() => fileInputRef.current?.click()}
            className="text-indigo-600 font-medium underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            browse
          </button>
        </p>

        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP · max {maxImages} photos</p>

        {/* Count indicator */}
        <span className="text-xs text-muted-foreground font-medium">
          {images.length}/{maxImages}
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          className="hidden"
          onChange={handleFileInput}
          disabled={!canAdd || compressing}
        />
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative w-20 h-20 rounded-lg overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt="preview"
                className="w-full h-full object-cover"
              />
              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                disabled={disabled || compressing}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed hover:bg-black/80"
                aria-label="Remove image"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
