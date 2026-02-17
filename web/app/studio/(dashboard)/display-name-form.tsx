'use client'

import { useRef, useState, useTransition } from 'react'
import { updateDisplayName } from './actions'
import { Check, Loader2 } from 'lucide-react'

export function DisplayNameForm({
  tagId,
  savedName,
}: {
  tagId: string
  savedName: string
}) {
  const [current, setCurrent] = useState(savedName)
  const [showSaved, setShowSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const isDirty = current !== savedName

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateDisplayName(formData)
      // After revalidation, savedName prop won't update in this render,
      // but we can show feedback and sync local state
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 2000)
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex gap-2 flex-1 min-w-0 items-center">
      <input type="hidden" name="tagId" value={tagId} />
      <input
        name="display_name"
        value={current}
        onChange={(e) => {
          setCurrent(e.target.value)
          setShowSaved(false)
        }}
        placeholder="チャンネル名"
        className={`s-input flex-1 text-sm min-w-0 transition-colors duration-200 ${
          isDirty
            ? ''
            : 'text-[var(--s-text-muted)] border-transparent bg-transparent'
        }`}
      />

      {/* Save button: only visible when dirty */}
      <button
        type="submit"
        disabled={isPending || !isDirty}
        className={`s-btn s-btn-primary text-xs shrink-0 transition-all duration-200 ${
          isDirty
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {isPending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            保存中...
          </>
        ) : (
          '保存'
        )}
      </button>

      {/* Saved confirmation */}
      <span
        className={`flex items-center gap-1 text-xs text-emerald-400 shrink-0 transition-all duration-300 ${
          showSaved
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-2 pointer-events-none'
        }`}
      >
        <Check className="w-3.5 h-3.5" />
        保存済み
      </span>
    </form>
  )
}
