'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface CollectionCardProps {
  collection: {
    id: string
    title: Record<string, string>
    description: Record<string, string> | null
    subject_count: number
    is_public: boolean
    user_id: string
    created_at: string
  }
  locale: string
  isOwner: boolean
  onDelete?: () => void
}

export default function CollectionCard({
  collection,
  locale,
  isOwner,
  onDelete,
}: CollectionCardProps) {
  const t = useTranslations('collection')

  const title =
    collection.title?.[locale] ??
    collection.title?.ko ??
    collection.title?.en ??
    ''

  const description =
    collection.description?.[locale] ??
    collection.description?.ko ??
    collection.description?.en ??
    null

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onDelete?.()
  }

  return (
    <Link
      href={`#`}
      className="group block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
          {title}
        </h3>

        {isOwner && onDelete && (
          <button
            onClick={handleDelete}
            aria-label={t('removeFromCollection')}
            className="shrink-0 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      {description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{description}</p>
      )}

      <div className="flex items-center gap-2 mt-auto">
        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          {collection.subject_count} {t('subjects')}
        </span>

        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            collection.is_public
              ? 'bg-green-50 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {collection.is_public ? (
            <>
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {t('public')}
            </>
          ) : (
            <>
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              {t('private')}
            </>
          )}
        </span>
      </div>
    </Link>
  )
}
