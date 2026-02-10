'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, Music } from 'lucide-react'

export function FileUploader({ tagId }: { tagId: string }) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // 1. Get signed upload URL
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

      // 2. Upload directly to Supabase Storage via signed URL
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadRes.ok) {
        throw new Error('Upload to storage failed')
      }

      // 3. Get audio duration
      const durationMs = await getAudioDuration(file).catch(() => 0)

      // 4. Commit metadata to DB
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
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="kawaii-card p-6 bg-white/70">
      <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center">
        <Music className="w-4 h-4 mr-2 text-pink-400" />
        オーディオをアップロード
      </h3>
      <form onSubmit={handleUpload} className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          required
          disabled={uploading}
          className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-pink-100 file:text-pink-500 hover:file:bg-pink-200 transition-all"
        />
        {error && (
          <p className="text-sm text-red-500 font-bold">{error}</p>
        )}
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-gradient-to-r from-pink-300 to-purple-300 text-white font-bold py-2.5 px-6 rounded-full shadow hover:scale-105 active:scale-95 transition-all kawaii-btn disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> アップロード中...</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" /> アップロード</>
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
