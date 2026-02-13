'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, Music } from 'lucide-react'

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

      if (!uploadRes.ok) {
        throw new Error('Upload to storage failed')
      }

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
      if (fileInputRef.current) fileInputRef.current.value = ''
      setFileName(null)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="s-card p-5">
      <h3 className="text-xs font-medium text-[var(--s-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Upload className="w-3.5 h-3.5" />
        アップロード
      </h3>
      <form onSubmit={handleUpload} className="space-y-3">
        {/* Custom file input */}
        <label className="block cursor-pointer">
          <div className="border border-dashed border-[var(--s-border)] rounded-lg p-4 text-center hover:border-[var(--s-accent)]/50 transition-colors">
            {fileName ? (
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--s-text)]">
                <Music className="w-4 h-4 text-[var(--s-accent)]" />
                <span className="truncate max-w-[200px]">{fileName}</span>
              </div>
            ) : (
              <div>
                <Upload className="w-5 h-5 text-[var(--s-text-muted)] mx-auto mb-1.5" />
                <p className="text-xs text-[var(--s-text-muted)]">
                  クリックしてファイルを選択
                </p>
              </div>
            )}
          </div>
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

        {error && (
          <p className="text-xs text-[var(--s-danger)] font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={uploading || !fileName}
          className="s-btn s-btn-primary w-full py-2.5 text-sm"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> アップロード中...</>
          ) : (
            <><Upload className="w-4 h-4" /> アップロード</>
          )}
        </button>
      </form>
    </div>
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
