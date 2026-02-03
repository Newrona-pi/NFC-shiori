'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, Loader2 } from 'lucide-react'

export function AudioPlayer({ audioId, autoPlay }: { audioId: string, autoPlay?: boolean }) {
    const [url, setUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [playing, setPlaying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        let mounted = true

        async function fetchUrl() {
            setLoading(true)
            try {
                const res = await fetch('/api/public/audio/signed-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ audioId })
                })
                if (!res.ok) throw new Error('Failed to load audio')
                const data = await res.json()
                if (mounted) {
                    setUrl(data.signedUrl)
                    // If autoplay requested, try to play when URL is ready
                    // But browser might block it.
                }
            } catch (err) {
                if (mounted) setError('Could not load audio.')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        if (audioId) fetchUrl()

        return () => { mounted = false }
    }, [audioId])

    useEffect(() => {
        if (url && autoPlay && audioRef.current) {
            audioRef.current.play().catch(() => {
                console.log("Autoplay blocked")
            })
        }
    }, [url, autoPlay])

    const togglePlay = () => {
        if (!audioRef.current) return
        if (playing) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }
    }

    if (error) return <div className="text-red-500 text-sm">{error}</div>

    return (
        <div className="w-full">
            {url && (
                <audio
                    ref={audioRef}
                    src={url}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => setPlaying(false)}
                />
            )}

            <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-2xl shadow-xl text-white">
                <Button
                    size="lg"
                    className="h-20 w-20 rounded-full text-2xl mb-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                    onClick={togglePlay}
                    disabled={loading || !url}
                >
                    {loading ? <Loader2 className="animate-spin h-8 w-8 text-white" /> : (
                        playing ? <Pause className="h-8 w-8 text-white fill-current" /> : <Play className="h-8 w-8 text-white fill-current translate-x-1" />
                    )}
                </Button>
                <p className="text-slate-400 text-sm mt-2">
                    {loading ? 'Decrypting Audio...' : (playing ? 'Now Playing' : 'Tap to Play')}
                </p>
            </div>
        </div>
    )
}
