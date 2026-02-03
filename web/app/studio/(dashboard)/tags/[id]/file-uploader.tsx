'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { Upload, Loader2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

export function FileUploader({ tagId }: { tagId: string }) {
    const router = useRouter()
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Create Supabase client for browser
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        const file = fileInputRef.current?.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            // Generate storage path
            const fileId = crypto.randomUUID()
            // Sanitize filename: replace non-ASCII with underscore
            const safeFilename = file.name.replace(/[^\x00-\x7F]/g, '_')
            const path = `tags/${tagId}/${fileId}_${safeFilename}`

            // 1. Upload directly using Supabase client SDK
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('audios')
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: file.type
                })

            if (uploadError) {
                console.error('Upload Error:', uploadError)
                throw new Error(uploadError.message)
            }

            // 2. Get audio duration (optional, for metadata)
            const durationMs = await getAudioDuration(file).catch(() => 0)

            // 3. Commit to database
            const commitRes = await fetch('/api/studio/upload/commit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tagId,
                    storagePath: uploadData.path,
                    title: file.name,
                    mimeType: file.type,
                    sizeBytes: file.size,
                    durationMs
                })
            })

            if (!commitRes.ok) {
                const errData = await commitRes.json().catch(() => ({}))
                throw new Error(errData.error || 'Commit failed')
            }

            router.refresh()
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Upload failed')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="rounded-md bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Audio</h3>
            <form onSubmit={handleUpload} className="space-y-4">
                <div>
                    <Input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        required
                        disabled={uploading}
                    />
                </div>
                {error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}
                <Button type="submit" disabled={uploading}>
                    {uploading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                    ) : (
                        <><Upload className="mr-2 h-4 w-4" /> Upload</>
                    )}
                </Button>
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
