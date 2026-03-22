'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { timeAgo } from '@/lib/utils/timeAgo'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  nickname?: string
}

interface CommentSectionProps {
  reviewId: string
  currentUserId: string | null
  locale: string
}

export default function CommentSection({
  reviewId,
  currentUserId,
  locale,
}: CommentSectionProps) {
  const t = useTranslations('comment')
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('review_comments')
      .select('id, content, created_at, user_id')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true })
      .limit(50)

    if (data) {
      // Batch fetch profiles for unique user_ids
      const uniqueUserIds = [...new Set(data.map((c) => c.user_id))]
      let profileMap: Record<string, string> = {}

      if (uniqueUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, nickname')
          .in('id', uniqueUserIds)

        if (profiles) {
          profileMap = Object.fromEntries(
            profiles.map((p: { id: string; nickname: string }) => [p.id, p.nickname])
          )
        }
      }

      setComments(
        data.map((c) => ({
          ...c,
          nickname: profileMap[c.user_id] ?? c.user_id.slice(0, 8),
        }))
      )
      setCommentCount(data.length)
    }
    setLoading(false)
  }, [reviewId])

  useEffect(() => {
    if (expanded) {
      fetchComments()
    }
  }, [expanded, fetchComments])

  const handleSubmit = async () => {
    if (!currentUserId || !inputValue.trim() || submitting) return
    setSubmitting(true)

    const optimisticComment: Comment = {
      id: `optimistic-${Date.now()}`,
      content: inputValue.trim(),
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      nickname: 'Me',
    }

    setComments((prev) => [...prev, optimisticComment])
    setCommentCount((prev) => prev + 1)
    const submittedContent = inputValue.trim()
    setInputValue('')

    const supabase = createClient()
    const { data, error } = await supabase
      .from('review_comments')
      .insert({ review_id: reviewId, user_id: currentUserId, content: submittedContent })
      .select('id, content, created_at, user_id')
      .single()

    if (error || !data) {
      // Revert optimistic update on error
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id))
      setCommentCount((prev) => prev - 1)
      setInputValue(submittedContent)
    } else {
      // Replace optimistic entry with real one
      setComments((prev) =>
        prev.map((c) =>
          c.id === optimisticComment.id
            ? { ...data, nickname: optimisticComment.nickname }
            : c
        )
      )
    }

    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    setCommentCount((prev) => Math.max(0, prev - 1))

    const supabase = createClient()
    await supabase.from('review_comments').delete().eq('id', commentId)
  }

  const toggleExpanded = () => {
    setExpanded((prev) => !prev)
  }

  return (
    <div className="mt-2">
      {/* Toggle button */}
      <button
        type="button"
        onClick={toggleExpanded}
        aria-label="댓글 펼치기"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span>
          {t('comments')}
          {commentCount > 0 && ` (${commentCount})`}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="bg-gray-50 rounded-b-xl -mx-4 -mb-4 px-4 py-3 mt-3 border-t border-gray-100">
          {/* Loading state */}
          {loading && (
            <p className="text-xs text-gray-400 py-2 text-center">Loading...</p>
          )}

          {/* Comments list */}
          {!loading && (
            <div className="space-y-2 mb-3">
              {comments.length === 0 ? (
                <p className="text-xs text-gray-400 py-1">{t('noComments')}</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2 group">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-700 mr-1.5">
                        {comment.nickname}
                      </span>
                      <span className="text-xs text-gray-600 break-words">
                        {comment.content}
                      </span>
                      <span className="text-xs text-gray-400 ml-1.5">
                        {timeAgo(comment.created_at)}
                      </span>
                    </div>
                    {currentUserId && comment.user_id === currentUserId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5 rounded shrink-0"
                        aria-label="Delete comment"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Input area */}
          {currentUserId ? (
            <div className="flex gap-2 items-end">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.slice(0, 500))}
                placeholder={t('writeComment')}
                rows={1}
                className="flex-1 text-xs resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 placeholder-gray-400 min-h-[34px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!inputValue.trim() || submitting}
                className="shrink-0 text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('submit')}
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">{t('loginToComment')}</p>
          )}
        </div>
      )}
    </div>
  )
}
