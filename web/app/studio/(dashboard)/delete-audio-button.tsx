'use client'

import { useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { deleteAudio } from './actions'

export function DeleteAudioButton({ audioId }: { audioId: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('この音声を削除しますか？')) return

    const formData = new FormData()
    formData.set('audioId', audioId)
    startTransition(() => deleteAudio(formData))
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="p-1.5 rounded-md text-[var(--s-text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0 disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
    </button>
  )
}
