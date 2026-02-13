'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, Music, X } from 'lucide-react'

export function FileUploader({ tagId }: { tagId: string }) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange() {
    const file = fileInputRef.current?.files?.[0]
    setFileName(file?.name || null)
    setError(null)
  }

  function clearFile() {
    if (fileInputRef.current) fileInputRef.current.value = ''
    setFileName(null)
    setError(null)
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const initRes = await fetch('/api/studio/upload/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId,
          filename: file.name.replace(/[^\x00-\x7F]/g, '_'),
          mimeType: file.type,
        }),
      })

      if (!initRes.ok) {
        const errData = await initRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to get upload URL')
      }

      const { signedUrl, path } = await initRes.json()

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadRes.ok) throw new Error('Upload to storage failed')

      const durationMs = await getAudioDuration(file).catch(() => 0)

      const commitRes = await fetch('/api/studio/upload/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId,
          storagePath: path,
          title: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          durationMs,
        }),
      })

      if (!commitRes.ok) {
        const errData = await commitRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Commit failed')
      }

      router.refresh()
      clearFile()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleUpload} className="s-card p-3">
      <div className="flex items-center gap-2">
        {/* File picker / selected file */}
        {fileName ? (
          <div className="flex items-center gap-2 flex-1 min-w-0 bg-[var(--s-bg)] border border-[var(--s-border)] rounded-lg px-3 py-2">
            <Music className="w-3.5 h-3.5 text-[var(--s-accent)] shrink-0" />
            <span className="text-sm text-[var(--s-text)] truncate">{fileName}</span>
            <button type="button" onClick={clearFile} className="text-[var(--s-text-muted)] hover:text-[var(--s-text)] ml-auto shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 flex-1 min-w-0 border border-dashed border-[var(--s-border)] rounded-lg px-3 py-2 cursor-pointer hover:border-[var(--s-text-muted)] transition-colors">
            <Upload className="w-3.5 h-3.5 text-[var(--s-text-muted)] shrink-0" />
            <span className="text-sm text-[var(--s-text-muted)]">ファイルを選択</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              required
              disabled={uploading}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        {/* Upload button */}
        <button
          type="submit"
          disabled={uploading || !fileName}
          className="s-btn s-btn-primary text-xs shrink-0"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {uploading ? '送信中...' : 'アップロード'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-[var(--s-danger)] mt-2 px-1">{error}</p>
      )}
    </form>
  )
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      window.URL.revokeObjectURL(audio.src)
      resolve(Math.round(audio.duration * 1000))
    }
    audio.onerror = reject
    audio.src = window.URL.createObjectURL(file)
  })
}
