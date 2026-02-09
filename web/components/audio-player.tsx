'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Heart, Music, Sparkles, Loader2 } from 'lucide-react'

// Cute bouncing visualizer bars
const BouncingBar = ({ delay, playing }: { delay: number, playing: boolean }) => (
    <div
        className={`w-2 bg-pink-300 rounded-full mx-0.5 transition-all duration-300 ${playing ? 'animate-bounce' : 'h-3'}`}
        style={{
            height: playing ? `${Math.random() * 24 + 12}px` : '12px',
            animationDuration: '0.6s',
            animationDelay: `${delay}s`,
            backgroundColor: playing ? '#ff9aeb' : '#fbceb1'
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
                if (mounted) setError('Voice data unavailable.')
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
        <div className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-pink-300 bg-pink-50/10 rounded-3xl text-pink-300 font-bold text-sm">
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

            {/* Kawaii Player Card */}
            <div className={`
                relative overflow-hidden rounded-[40px] 
                bg-gradient-to-br from-white/10 to-white/5 
                backdrop-blur-xl border-4 border-white/20 
                shadow-[0_10px_40px_-10px_rgba(255,105,180,0.3)]
                p-8 flex flex-col items-center justify-center 
                transition-all duration-500 hover:scale-[1.02]
                ${playing ? 'shadow-[0_0_60px_rgba(255,105,180,0.5)] border-pink-300/50' : ''}
            `}>

                {/* Decoration: Floating Hearts */}
                <div className="absolute top-4 right-6 text-pink-400/30 animate-pulse">
                    <Heart className="w-6 h-6 fill-current" />
                </div>
                <div className="absolute bottom-6 left-6 text-purple-400/30 animate-pulse delay-700">
                    <Sparkles className="w-6 h-6" />
                </div>

                {/* Play Button Circle */}
                <div className="relative z-10 mb-6 group-hover:scale-105 transition-transform duration-300">

                    {/* Pulsing Aura */}
                    <div className={`absolute inset-0 -m-6 bg-pink-500/20 rounded-full blur-xl transition-all duration-500 ${playing ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`} />

                    <button
                        onClick={togglePlay}
                        disabled={loading || !url}
                        className={`
                            relative w-28 h-28 rounded-full flex items-center justify-center
                            bg-gradient-to-tr from-pink-500 to-purple-500
                            border-4 border-white/30 shadow-lg
                            transition-all duration-300 active:scale-90
                            kawaii-btn
                            disabled:opacity-50 disabled:grayscale
                        `}
                    >
                        {loading ? (
                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                        ) : playing ? (
                            <Pause className="w-10 h-10 text-white fill-current drop-shadow-md" />
                        ) : (
                            <Play className="w-10 h-10 text-white fill-current ml-2 drop-shadow-md" />
                        )}
                    </button>

                    {/* Cute Status Badge */}
                    <div className={`
                        absolute -bottom-2 left-1/2 transform -translate-x-1/2
                        bg-white text-pink-500 text-[10px] font-bold px-3 py-1 rounded-full shadow-md
                        transition-opacity duration-300
                        ${playing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                    `}>
                        NOW PLAYING ♪
                    </div>
                </div>

                {/* Title & Visualizer */}
                <div className="relative z-10 text-center space-y-3 max-w-xs w-full">
                    <h2 className="text-white font-bold text-xl tracking-tight leading-tight drop-shadow-sm font-mplus">
                        {title || 'Unknown Track'}
                    </h2>

                    <div className="h-8 flex items-center justify-center">
                        {playing ? (
                            <div className="flex items-end justify-center h-full space-x-1">
                                {[...Array(6)].map((_, i) => (
                                    <BouncingBar key={i} delay={i * 0.08} playing={playing} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-pink-200/80 text-xs font-bold tracking-widest uppercase bg-white/10 px-3 py-1 rounded-full inline-block">
                                {loading ? 'Loading...' : 'Touch to listen'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Progress Bar (Pink & Cute) */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-900/20">
                    <div
                        className="h-full bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 animate-gradient-x shadow-[0_0_15px_#ff9aeb]"
                        style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
                    />
                </div>
            </div>
        </div>
    )
}
