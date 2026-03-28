'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

interface AddToCollectionButtonProps {
  subjectId: string
  currentUserId: string | null
}

interface Collection {
  id: string
  title: Record<string, string>
}

type FeedbackState = 'idle' | 'success' | 'error' | 'already'

export default function AddToCollectionButton({
  subjectId,
  currentUserId,
}: AddToCollectionButtonProps) {
  const t = useTranslations('collection')
  const [open, setOpen] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [loadingCollections, setLoadingCollections] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState>('idle')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function loadCollections() {
    if (!currentUserId) return
    setLoadingCollections(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('collections')
        .select('id, title')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
      setCollections(data ?? [])
    } finally {
      setLoadingCollections(false)
    }
  }

  function handleOpen() {
    if (!currentUserId) return
    setOpen((prev) => !prev)
    if (!open) {
      void loadCollections()
    }
  }

  async function handleAddToCollection(collectionId: string) {
    if (!currentUserId || adding) return
    setAdding(collectionId)
    setFeedback('idle')

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('collection_items')
        .insert({ collection_id: collectionId, subject_id: subjectId })

      if (error) {
        // Unique constraint violation = already added
        if (error.code === '23505') {
          setFeedback('already')
        } else {
          setFeedback('error')
        }
      } else {
        setFeedback('success')
      }
    } catch {
      setFeedback('error')
    } finally {
      setAdding(null)
      setOpen(false)
      // Reset feedback after 2 seconds
      setTimeout(() => setFeedback('idle'), 2000)
    }
  }

  if (!currentUserId) return null

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          feedback === 'success'
            ? 'bg-green-50 dark:bg-green-950/30 text-green-700 border-green-200'
            : feedback === 'error'
            ? 'bg-red-50 dark:bg-red-950/30 text-red-600 border-red-200'
            : feedback === 'already'
            ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 border-yellow-200'
            : 'bg-card text-foreground/80 border-border hover:bg-indigo-50 dark:bg-indigo-950/30 hover:text-indigo-700 hover:border-indigo-200'
        }`}
      >
        <svg
          className="w-3.5 h-3.5"
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
        {feedback === 'success'
          ? '✓ Added'
          : feedback === 'error'
          ? 'Error'
          : feedback === 'already'
          ? 'Already added'
          : t('addToCollection')}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 right-0 w-56 bg-card rounded-xl border border-border shadow-lg overflow-hidden">
          {loadingCollections ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              <div className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : collections.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              {t('noCollections')}
            </div>
          ) : (
            <ul className="py-1 max-h-48 overflow-y-auto">
              {collections.map((col) => {
                const title =
                  col.title?.ko ?? col.title?.en ?? ''
                return (
                  <li key={col.id}>
                    <button
                      onClick={() => void handleAddToCollection(col.id)}
                      disabled={adding === col.id}
                      className="w-full text-left px-3 py-2 text-sm text-foreground/80 hover:bg-indigo-50 dark:bg-indigo-950/30 hover:text-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {adding === col.id ? (
                        <span className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 border border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                          {title}
                        </span>
                      ) : (
                        title
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
