'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Heart, Music, Sparkles, Loader2 } from 'lucide-react'

// Cute bouncing visualizer bars (Pastel)
const BouncingBar = ({ delay, playing }: { delay: number, playing: boolean }) => (
    <div
        className={`w-2 bg-pink-300 rounded-full mx-0.5 transition-all duration-300 ${playing ? 'animate-bounce' : 'h-3'}`}
        style={{
            height: playing ? `${Math.random() * 24 + 12}px` : '12px',
            animationDuration: '0.6s',
            animationDelay: `${delay}s`,
            backgroundColor: playing ? '#ffb7e3' : '#e0e0e0'
        }}
    />
)

export function AudioPlayer({ audioId, autoPlay, title }: { audioId: string, autoPlay?: boolean, title?: string }) {
    const [url, setUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [playing, setPlaying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        let mounted = true
        setProgress(0)
        setPlaying(false)

        async function fetchUrl() {
            setLoading(true)
            setError(null)
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
                }
            } catch (err) {
                if (mounted) setError('音声データの取得に失敗しました')
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

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime
            const duration = audioRef.current.duration || 1
            setProgress((current / duration) * 100)
        }
    }

    if (error) return (
        <div className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-red-200 bg-red-50 rounded-[32px] text-red-400 font-bold text-sm">
            <span className="mb-1 text-2xl">🥺</span>
            {error}
        </div>
    )

    return (
        <div className="w-full relative group perspective-1000">
            {url && (
                <audio
                    ref={audioRef}
                    src={url}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => { setPlaying(false); setProgress(0); }}
                    onTimeUpdate={handleTimeUpdate}
                />
            )}

            {/* Kawaii Player Card (Light Theme) */}
            <div className={`
                relative overflow-hidden rounded-[40px] 
                bg-white/60
                backdrop-blur-xl border-4 border-white/80 
                shadow-[0_10px_40px_-5px_rgba(162,210,255,0.3)]
                p-8 flex flex-col items-center justify-center 
                transition-all duration-500 hover:scale-[1.02]
                ${playing ? 'shadow-[0_0_60px_rgba(255,183,227,0.4)] border-pink-200' : ''}
            `}>

                {/* Decoration: Floating Hearts */}
                <div className="absolute top-4 right-6 text-pink-300 animate-pulse">
                    <Heart className="w-6 h-6 fill-current" />
                </div>
                <div className="absolute bottom-6 left-6 text-purple-300 animate-pulse delay-700">
                    <Sparkles className="w-6 h-6" />
                </div>

                {/* Play Button Circle */}
                <div className="relative z-10 mb-6 group-hover:scale-105 transition-transform duration-300">

                    {/* Pulsing Aura */}
                    <div className={`absolute inset-0 -m-6 bg-pink-300/30 rounded-full blur-xl transition-all duration-500 ${playing ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`} />

                    <button
                        onClick={togglePlay}
                        disabled={loading || !url}
                        className={`
                            relative w-28 h-28 rounded-full flex items-center justify-center
                            bg-gradient-to-tr from-pink-300 to-purple-300
                            border-[6px] border-white shadow-xl
                            transition-all duration-300 active:scale-90
                            kawaii-btn
                            disabled:opacity-50 disabled:grayscale
                        `}
                    >
                        {loading ? (
                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                        ) : playing ? (
                            <Pause className="w-10 h-10 text-white fill-current drop-shadow-md ml-0.5" />
                        ) : (
                            <Play className="w-10 h-10 text-white fill-current ml-2 drop-shadow-md" />
                        )}
                    </button>

                    {/* Cute Status Badge */}
                    <div className={`
                        absolute -bottom-3 left-1/2 transform -translate-x-1/2
                        bg-white text-pink-400 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md border border-pink-100
                        transition-opacity duration-300 whitespace-nowrap
                        ${playing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                    `}>
                        再生中 ♪
                    </div>
                </div>

                {/* Title & Visualizer */}
                <div className="relative z-10 text-center space-y-3 max-w-xs w-full">
                    <h2 className="text-slate-700 font-bold text-xl tracking-tight leading-tight font-mplus">
                        {title || 'タイトルなし'}
                    </h2>

                    <div className="h-8 flex items-center justify-center">
                        {playing ? (
                            <div className="flex items-end justify-center h-full space-x-1">
                                {[...Array(6)].map((_, i) => (
                                    <BouncingBar key={i} delay={i * 0.08} playing={playing} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase bg-white/40 px-4 py-1.5 rounded-full inline-block">
                                {loading ? '読込中...' : 'タップして再生'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Progress Bar (Pink & Cute) */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-100">
                    <div
                        className="h-full bg-gradient-to-r from-pink-300 via-purple-300 to-pink-300 animate-gradient-x"
                        style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
                    />
                </div>
            </div>
        </div>
    )
}
