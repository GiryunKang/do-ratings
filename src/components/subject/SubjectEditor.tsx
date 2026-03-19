'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SubjectEditorProps {
  subjectId: string
  currentDescription: Record<string, string> | null
  locale: string
  currentUserId: string | null
}

export default function SubjectEditor({ subjectId, currentDescription, locale, currentUserId }: SubjectEditorProps) {
  const [editing, setEditing] = useState(false)
  const [description, setDescription] = useState(currentDescription?.[locale] ?? '')
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<Array<{ id: string; new_value: Record<string, string>; old_value: Record<string, string> | null; created_at: string }>>([])
  const ko = locale === 'ko'

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()

    const newDesc = {
      ...currentDescription,
      [locale]: description,
    }

    // Save edit history
    await supabase.from('subject_edits').insert({
      subject_id: subjectId,
      user_id: currentUserId,
      field: 'description',
      old_value: currentDescription,
      new_value: newDesc,
    })

    // Update subject description
    await supabase.from('subjects').update({ description: newDesc }).eq('id', subjectId)

    setEditing(false)
    setSaving(false)
  }

  async function loadHistory() {
    if (showHistory) {
      setShowHistory(false)
      return
    }
    const supabase = createClient()
    const { data } = await supabase
      .from('subject_edits')
      .select('id, new_value, old_value, created_at')
      .eq('subject_id', subjectId)
      .eq('field', 'description')
      .order('created_at', { ascending: false })
      .limit(10)
    setHistory((data ?? []) as typeof history)
    setShowHistory(true)
  }

  if (!currentUserId) {
    return currentDescription?.[locale] ? (
      <p className="text-sm text-muted-foreground">{currentDescription[locale]}</p>
    ) : null
  }

  if (!editing) {
    return (
      <div className="space-y-1">
        <div className="group">
          {currentDescription?.[locale] ? (
            <p className="text-sm text-muted-foreground">{currentDescription[locale]}</p>
          ) : (
            <p className="text-xs text-muted-foreground italic">{ko ? '설명이 없습니다' : 'No description yet'}</p>
          )}
          <button
            onClick={() => setEditing(true)}
            className="mt-1 text-xs text-primary hover:underline flex items-center gap-1 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            {ko ? '편집' : 'Edit'}
          </button>
        </div>

        {/* Edit history toggle */}
        <button
          onClick={loadHistory}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {showHistory ? (ko ? '이력 숨기기' : 'Hide history') : (ko ? '편집 이력' : 'Edit history')}
        </button>

        {showHistory && history.length > 0 && (
          <div className="mt-2 space-y-2 border border-border rounded-lg p-3 bg-muted/30">
            {history.map((entry) => (
              <div key={entry.id} className="text-xs space-y-0.5">
                <div className="text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}
                </div>
                {entry.new_value?.[locale] && (
                  <div className="text-foreground line-clamp-2">{entry.new_value[locale]}</div>
                )}
                {entry.old_value?.[locale] !== undefined && (
                  <div className="text-muted-foreground line-through line-clamp-1">{entry.old_value[locale] || (ko ? '(없음)' : '(empty)')}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {showHistory && history.length === 0 && (
          <div className="text-xs text-muted-foreground">{ko ? '편집 이력이 없습니다' : 'No edit history yet'}</div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder={ko ? '이 대상에 대한 설명을 작성해주세요...' : 'Write a description for this subject...'}
        className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{description.length}/1000</span>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditing(false); setDescription(currentDescription?.[locale] ?? '') }}
            className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted transition-colors"
          >
            {ko ? '취소' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/80 disabled:opacity-50 transition-colors"
          >
            {saving ? '...' : (ko ? '저장' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  )
}
