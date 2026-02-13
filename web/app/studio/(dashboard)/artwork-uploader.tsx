'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ImageIcon, Upload, Loader2, X, Disc3 } from 'lucide-react'

export function ArtworkUploader({ tagId, currentArtworkUrl }: { tagId: string; currentArtworkUrl: string | null }) {
    const router = useRouter()
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentArtworkUrl)
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Preview immediately
        const objectUrl = URL.createObjectURL(file)
        setPreviewUrl(objectUrl)
        setError(null)
        setUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('tagId', tagId)

            const res = await fetch('/api/studio/artwork/upload', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || 'アップロードに失敗しました')
            }

            const data = await res.json()
            if (data.artworkUrl) {
                setPreviewUrl(data.artworkUrl)
            }
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'アップロードに失敗しました')
            setPreviewUrl(currentArtworkUrl)
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <div className="s-card p-3">
            <div className="flex items-center gap-3">
                {/* Preview / Placeholder */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[var(--s-bg)] border border-[var(--s-border)] flex items-center justify-center">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Artwork"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Disc3 className="w-7 h-7 text-[var(--s-text-muted)]" />
                    )}
                    {uploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                    )}
                </div>

                {/* Info + Upload button */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <ImageIcon className="w-3.5 h-3.5 text-[var(--s-text-muted)] shrink-0" />
                        <span className="text-xs font-medium text-[var(--s-text-muted)] uppercase tracking-wider">
                            カバー画像
                        </span>
                    </div>
                    <p className="text-[11px] text-[var(--s-text-muted)]">
                        {previewUrl ? '視聴ページのジャケットに表示されます' : '画像を設定するとCDジャケットとして表示されます'}
                    </p>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="s-btn s-btn-ghost text-xs shrink-0"
                >
                    <Upload className="w-3.5 h-3.5" />
                    {previewUrl ? '変更' : '設定'}
                </button>
            </div>

            {error && (
                <p className="text-xs text-[var(--s-danger)] mt-2 px-1">{error}</p>
            )}
        </div>
    )
}
