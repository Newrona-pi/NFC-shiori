'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Loader2, RefreshCw } from 'lucide-react'

// Audio visualizer bars (simulated)
const Bar = ({ delay, playing }: { delay: number, playing: boolean }) => (
    <div
        className={`w-1 bg-cyan-400 rounded-full transition-all duration-300 ${playing ? 'animate-pulse' : 'h-2'}`}
        style={{
            height: playing ? `${Math.random() * 20 + 10}px` : '4px',
            animationDuration: '0.8s',
            animationDelay: `${delay}s`,
            animationIterationCount: 'infinite'
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
                console.log("Autoplay blocked by browser policy")
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
        <div className="w-full h-48 flex flex-col items-center justify-center border border-red-500/30 bg-red-950/20 rounded-2xl text-red-400 font-mono text-sm">
            <span className="mb-2">⚠ ERROR</span>
            {error}
        </div>
    )

    return (
        <div className="w-full relative group">
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

            {/* Main Player Card */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl p-8 flex flex-col items-center justify-center transition-transform duration-500 hover:scale-[1.02]">

                {/* Background Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 opacity-50 ${playing ? 'animate-pulse' : ''}`} />

                {/* Cyber Circle (Play Button Wrapper) */}
                <div className="relative z-10 mb-6">
                    {/* Rotating Rings */}
                    <div className={`absolute inset-0 -m-4 border border-cyan-500/20 rounded-full ${playing ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
                    <div className={`absolute inset-0 -m-2 border border-purple-500/20 rounded-full ${playing ? 'animate-[spin_6s_linear_infinite_reverse]' : ''}`} />

                    <button
                        onClick={togglePlay}
                        disabled={loading || !url}
                        className={`
                            relative w-24 h-24 rounded-full flex items-center justify-center
                            bg-slate-950 border border-white/10 shadow-[0_0_30px_rgba(0,255,242,0.2)]
                            transition-all duration-300 hover:shadow-[0_0_50px_rgba(0,255,242,0.4)] hover:scale-105 active:scale-95
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {loading ? (
                            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        ) : playing ? (
                            <Pause className="w-8 h-8 text-cyan-400 fill-current" />
                        ) : (
                            <Play className="w-8 h-8 text-cyan-400 fill-current ml-1" />
                        )}
                    </button>
                </div>

                {/* Title & Status */}
                <div className="relative z-10 text-center space-y-2 max-w-xs">
                    <h2 className="text-white font-bold text-lg tracking-wide line-clamp-1 font-outfit uppercase">
                        {title || 'Unknown Track'}
                    </h2>
                    <div className="flex items-center justify-center space-x-1 h-6">
                        {/* Fake Visualizer */}
                        {[...Array(5)].map((_, i) => (
                            <Bar key={i} delay={i * 0.1} playing={playing} />
                        ))}
                    </div>
                    <p className="text-cyan-200/60 text-xs font-mono tracking-widest uppercase">
                        {loading ? 'Decrypting...' : (playing ? 'Playing Audio' : 'Ready to Play')}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 shadow-[0_0_10px_#00fff2]"
                        style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
                    />
                </div>
            </div>
        </div>
    )
}
