'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Music, Loader2 } from 'lucide-react'

interface Audio {
    id: string
    title: string | null
    duration_ms: number | null
    created_at: string
}

interface Tag {
    display_name: string | null
    slug: string
}

function formatTime(seconds: number): string {
    if (!seconds || !isFinite(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
}

function Artwork({ playing, artworkUrl }: { playing: boolean; artworkUrl?: string | null }) {
    if (artworkUrl) {
        // CD / Vinyl style artwork
        return (
            <div className="relative w-64 sm:w-72 md:w-80 aspect-square">
                {/* Outer glow when playing */}
                <div className={`absolute inset-0 -m-4 rounded-full blur-2xl transition-all duration-1000 ${playing ? 'opacity-40 scale-110' : 'opacity-0 scale-100'
                    }`} style={{
                        background: 'radial-gradient(circle, rgba(251,113,133,0.5) 0%, rgba(167,139,250,0.4) 50%, transparent 70%)'
                    }} />

                {/* CD Disc */}
                <div className={`relative w-full h-full rounded-full overflow-hidden shadow-2xl shadow-black/30 transition-all duration-700 ${playing ? 'animate-cd-spin' : ''
                    }`}
                    style={{
                        animationPlayState: playing ? 'running' : 'paused',
                    }}>
                    {/* Artwork image - fills entire disc */}
                    <img
                        src={artworkUrl}
                        alt="Artwork"
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* CD surface sheen overlay */}
                    <div className="absolute inset-0 rounded-full" style={{
                        background: `
                            radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 50%),
                            radial-gradient(circle, transparent 28%, rgba(0,0,0,0.05) 29%, rgba(0,0,0,0.05) 30%, transparent 31%),
                            radial-gradient(circle, transparent 45%, rgba(255,255,255,0.03) 46%, rgba(255,255,255,0.03) 47%, transparent 48%),
                            radial-gradient(circle, transparent 60%, rgba(0,0,0,0.03) 61%, rgba(0,0,0,0.03) 62%, transparent 63%)
                        `
                    }} />

                    {/* Center hole - semi-transparent so artwork shows through */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[18%] h-[18%] rounded-full bg-white/20 shadow-inner border border-white/30" />
                    </div>

                    {/* Center ring detail */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[22%] h-[22%] rounded-full border border-white/20" />
                    </div>
                </div>

                {/* Reflection highlight when playing */}
                <div className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-1000 ${playing ? 'opacity-100' : 'opacity-0'
                    }`} style={{
                        background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.08) 10%, transparent 20%, transparent 100%)',
                    }} />
            </div>
        )
    }

    // Default: animated gradient blobs (no artwork)
    return (
        <div className="relative w-64 sm:w-72 md:w-80 aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-black/20">
            {/* Base */}
            <div className="absolute inset-0 bg-zinc-900" />

            {/* Animated gradient blobs */}
            <div className={`absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full bg-rose-400/80 blur-3xl transition-opacity duration-1000 ${playing ? 'animate-blob-1 opacity-80' : 'opacity-50'}`} />
            <div className={`absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 rounded-full bg-violet-500/80 blur-3xl transition-opacity duration-1000 ${playing ? 'animate-blob-2 opacity-80' : 'opacity-50'}`} />
            <div className={`absolute top-1/4 -right-1/4 w-2/3 h-2/3 rounded-full bg-sky-400/60 blur-3xl transition-opacity duration-1000 ${playing ? 'animate-blob-3 opacity-60' : 'opacity-30'}`} />
            <div className={`absolute -bottom-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-amber-300/50 blur-3xl transition-opacity duration-1000 ${playing ? 'animate-blob-4 opacity-50' : 'opacity-25'}`} />

            {/* Center visual */}
            <div className="absolute inset-0 flex items-center justify-center">
                {playing ? (
                    <div className="flex items-end gap-[3px] h-8">
                        {[0, 1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className="w-[5px] bg-white/90 rounded-full animate-eq"
                                style={{ animationDelay: `${i * 0.15}s` }}
                            />
                        ))}
                    </div>
                ) : (
                    <Music className="w-12 h-12 text-white/25" />
                )}
            </div>
        </div>
    )
}

export function ListenerView({ tag, audios, latestAudioId, artworkUrl }: { tag: Tag; audios: Audio[]; latestAudioId: string | null; artworkUrl?: string | null }) {
    const [currentIndex, setCurrentIndex] = useState(() => {
        if (!latestAudioId) return 0
        const idx = audios.findIndex(a => a.id === latestAudioId)
        return idx >= 0 ? idx : 0
    })
    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [url, setUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [seeking, setSeeking] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)
    const progressRef = useRef<HTMLDivElement>(null)

    const currentAudio = audios[currentIndex] ?? null
    const hasNext = currentIndex < audios.length - 1
    const hasPrev = currentIndex > 0

    // Fetch signed URL when track changes
    useEffect(() => {
        if (!currentAudio) return
        let mounted = true
        setUrl(null)
        setProgress(0)
        setCurrentTime(0)
        setDuration(0)
        setPlaying(false)
        setError(null)

        async function fetchUrl() {
            setLoading(true)
            try {
                const res = await fetch('/api/public/audio/signed-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ audioId: currentAudio.id })
                })
                if (!res.ok) throw new Error('Failed')
                const data = await res.json()
                if (mounted) setUrl(data.signedUrl)
            } catch {
                if (mounted) setError('音声を読み込めませんでした')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchUrl()
        return () => { mounted = false }
    }, [currentAudio])

    // Autoplay when URL loads
    useEffect(() => {
        if (url && audioRef.current) {
            audioRef.current.play().catch(() => { })
        }
    }, [url])

    const togglePlay = () => {
        if (!audioRef.current) return
        playing ? audioRef.current.pause() : audioRef.current.play()
    }

    const skipNext = () => {
        if (hasNext) setCurrentIndex(i => i + 1)
    }

    const skipPrev = () => {
        if (audioRef.current && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0
        } else if (hasPrev) {
            setCurrentIndex(i => i - 1)
        } else if (audioRef.current) {
            audioRef.current.currentTime = 0
        }
    }

    const handleTimeUpdate = () => {
        if (!audioRef.current || seeking) return
        const ct = audioRef.current.currentTime
        const dur = audioRef.current.duration || 1
        setCurrentTime(ct)
        setDuration(dur)
        setProgress((ct / dur) * 100)
    }

    const handleSeek = (clientX: number) => {
        if (!progressRef.current || !audioRef.current) return
        const rect = progressRef.current.getBoundingClientRect()
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
        const dur = audioRef.current.duration || 0
        audioRef.current.currentTime = pct * dur
        setProgress(pct * 100)
        setCurrentTime(pct * dur)
    }

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        setSeeking(true)
        handleSeek(e.clientX)
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (seeking) handleSeek(e.clientX)
    }

    const handlePointerUp = () => {
        setSeeking(false)
    }

    const handleEnded = () => {
        if (hasNext) {
            setCurrentIndex(i => i + 1)
        } else {
            setPlaying(false)
            setProgress(0)
            setCurrentTime(0)
        }
    }

    const selectTrack = (index: number) => {
        if (index === currentIndex) {
            togglePlay()
        } else {
            setCurrentIndex(index)
        }
    }

    // Empty state
    if (audios.length === 0) {
        return (
            <div className="listener-modern min-h-screen flex flex-col items-center justify-center px-6">
                <div className="w-24 h-24 rounded-full bg-black/[0.04] flex items-center justify-center mb-6">
                    <Music className="w-10 h-10 text-zinc-300" />
                </div>
                <p className="text-zinc-500 text-lg font-medium">まだメッセージがありません</p>
                <p className="text-zinc-400 text-sm mt-2">音声メッセージが届くとここに表示されます</p>
            </div>
        )
    }

    return (
        <div className="listener-modern min-h-screen relative overflow-hidden select-none">
            {/* Hidden audio element */}
            {url && (
                <audio
                    ref={audioRef}
                    src={url}
                    playsInline
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={handleEnded}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={() => {
                        if (audioRef.current) setDuration(audioRef.current.duration)
                    }}
                />
            )}

            {/* Background ambient glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div
                    className={`absolute top-[15%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[180px] transition-opacity duration-1000 ${playing ? 'opacity-30' : 'opacity-15'}`}
                    style={{
                        background: 'radial-gradient(circle, rgba(251,113,133,0.4) 0%, rgba(167,139,250,0.3) 40%, transparent 70%)'
                    }}
                />
            </div>

            {/* Main content */}
            <div className="relative z-10 max-w-md mx-auto px-6 pt-10 pb-8 flex flex-col items-center min-h-screen">

                {/* Header */}
                <div className="w-full text-center mb-8">
                    <p className="text-[11px] text-zinc-400 uppercase tracking-[0.2em] font-medium">
                        Playing From
                    </p>
                    <p className="text-sm text-zinc-700 font-semibold mt-1">
                        {tag.display_name || 'NFC Shiori'}
                    </p>
                </div>

                {/* Artwork */}
                <div className="mb-10">
                    <Artwork playing={playing} artworkUrl={artworkUrl} />
                </div>

                {/* Track Info */}
                <div className="w-full text-center mb-6 px-4">
                    <h1 className="text-xl font-bold text-zinc-900 truncate">
                        {currentAudio?.title || 'タイトルなし'}
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {currentAudio ? new Date(currentAudio.created_at).toLocaleDateString('ja-JP', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        }) : ''}
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="w-full mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Progress / Seek Bar */}
                <div className="w-full px-2 mb-6">
                    <div
                        ref={progressRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className="relative w-full h-7 flex items-center cursor-pointer group touch-none"
                    >
                        <div className="absolute left-0 right-0 h-[3px] bg-black/[0.08] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-zinc-800 rounded-full"
                                style={{ width: `${progress}%`, transition: seeking ? 'none' : 'width 0.15s linear' }}
                            />
                        </div>
                        {/* Knob */}
                        <div
                            className="absolute top-1/2 w-4 h-4 bg-zinc-800 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            style={{
                                left: `${progress}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        />
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-400 tabular-nums mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-10 mb-10">
                    <button
                        onClick={skipPrev}
                        className="text-zinc-400 hover:text-zinc-800 transition-colors"
                    >
                        <SkipBack className="w-7 h-7 fill-current" />
                    </button>

                    <button
                        onClick={togglePlay}
                        disabled={loading || !url}
                        className="w-[72px] h-[72px] rounded-full bg-zinc-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-30 disabled:hover:scale-100"
                    >
                        {loading ? (
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        ) : playing ? (
                            <Pause className="w-8 h-8 text-white fill-current" />
                        ) : (
                            <Play className="w-8 h-8 text-white fill-current ml-1" />
                        )}
                    </button>

                    <button
                        onClick={skipNext}
                        disabled={!hasNext}
                        className="text-zinc-400 hover:text-zinc-800 transition-colors disabled:text-zinc-300 disabled:cursor-default"
                    >
                        <SkipForward className="w-7 h-7 fill-current" />
                    </button>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-black/[0.06] mb-6" />

                {/* Track List */}
                <div className="w-full flex-1">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.15em]">
                            再生リスト
                        </h2>
                        <span className="text-xs text-zinc-400 tabular-nums">
                            {audios.length}曲
                        </span>
                    </div>

                    <div className="space-y-0.5 max-h-[50vh] overflow-y-auto tracklist-scroll">
                        {audios.map((audio, index) => {
                            const isActive = currentIndex === index
                            return (
                                <button
                                    key={audio.id}
                                    onClick={() => selectTrack(index)}
                                    className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-colors ${isActive ? 'bg-black/[0.04]' : 'hover:bg-black/[0.03]'
                                        }`}
                                >
                                    {/* Track number / playing indicator */}
                                    <div className="w-7 flex-shrink-0 text-center">
                                        {isActive && playing ? (
                                            <div className="flex items-end justify-center gap-[2px] h-4">
                                                {[0, 1, 2].map(i => (
                                                    <div
                                                        key={i}
                                                        className="w-[3px] rounded-full animate-eq"
                                                        style={{
                                                            animationDelay: `${i * 0.2}s`,
                                                            backgroundColor: '#e11d48'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <span className={`text-sm tabular-nums ${isActive ? 'text-rose-600 font-medium' : 'text-zinc-400'}`}>
                                                {index + 1}
                                            </span>
                                        )}
                                    </div>

                                    {/* Title & date */}
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className={`text-sm truncate ${isActive ? 'text-zinc-900 font-medium' : 'text-zinc-600'}`}>
                                            {audio.title || 'タイトルなし'}
                                        </p>
                                        <p className="text-[11px] text-zinc-400 mt-0.5">
                                            {new Date(audio.created_at).toLocaleDateString('ja-JP')}
                                        </p>
                                    </div>

                                    {/* Duration */}
                                    <span className="text-[11px] text-zinc-400 tabular-nums flex-shrink-0">
                                        {formatTime((audio.duration_ms ?? 0) / 1000)}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pb-6 text-center">
                    <p className="text-[10px] text-zinc-300 tracking-[0.2em] uppercase">
                        NFC Shiori
                    </p>
                </div>
            </div>
        </div>
    )
}
