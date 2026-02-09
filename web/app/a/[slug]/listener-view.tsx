'use client'

import { useState } from 'react'
import { AudioPlayer } from '@/components/audio-player'
import { Clock, Calendar, Heart, Music, Sparkles } from 'lucide-react'

// Cute floating shape
const Blob = ({ color, top, left, delay, size }: any) => (
    <div
        className={`absolute rounded-full filter blur-[60px] opacity-40 animate-float-slow`}
        style={{
            backgroundColor: color,
            top: top,
            left: left,
            width: size,
            height: size,
            animationDelay: delay
        }}
    />
)

interface Audio {
    id: string
    title: string
    duration_ms: number
    created_at: string
}

interface Tag {
    display_name: string
    slug: string
}

export function ListenerView({ tag, audios, latestAudioId }: { tag: Tag, audios: Audio[], latestAudioId: string | null }) {
    const [currentId, setCurrentId] = useState<string | null>(latestAudioId)
    const [autoPlay, setAutoPlay] = useState(false)

    const handlePlay = (id: string) => {
        if (currentId !== id) {
            setCurrentId(id)
            setAutoPlay(true)
        }
    }

    const currentAudio = audios.find(a => a.id === currentId)

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white font-sans overflow-hidden relative selection:bg-pink-300 selection:text-white">

            {/* Dreamy Background Blobs */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <Blob color="#ff9aeb" top="-10%" left="-10%" size="600px" delay="0s" />
                <Blob color="#89cff0" top="40%" right="-20%" size="500px" delay="3s" />
                <Blob color="#9d4edd" bottom="-10%" left="20%" size="400px" delay="5s" />

                {/* Subtle stars/dust */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 max-w-lg mx-auto px-6 py-12 flex flex-col items-center min-h-screen">

                {/* Brand / Header */}
                <div className="mb-10 text-center transform transition-transform duration-500 hover:scale-105">
                    <div className="inline-flex items-center justify-center bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 mb-4 shadow-lg animate-float-slow">
                        <Sparkles className="w-4 h-4 text-yellow-300 mr-2" />
                        <span className="text-xs font-bold text-white tracking-widest uppercase">Secret Message</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-white to-blue-300 drop-shadow-[0_2px_10px_rgba(255,154,235,0.5)] font-mplus leading-tight pb-2">
                        {tag.display_name}
                    </h1>
                </div>

                {/* Main Player Area */}
                <div className="w-full mb-12 perspective-1000">
                    {currentId ? (
                        <div className="transform transition-all duration-500 hover:rotate-1">
                            <AudioPlayer
                                audioId={currentId}
                                autoPlay={autoPlay}
                                title={currentAudio?.title}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 w-full rounded-[40px] bg-white/5 border-2 border-dashed border-white/20 text-pink-200/50 backdrop-blur-sm">
                            <Music className="w-12 h-12 mb-4 opacity-50 animate-bounce" />
                            <span className="font-mplus font-bold text-lg">No Messages Yet...</span>
                        </div>
                    )}
                </div>

                {/* Archive List (Memories) */}
                <div className="w-full bg-slate-900/30 backdrop-blur-md rounded-[32px] border border-white/10 p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center space-x-2">
                            <Heart className="w-5 h-5 text-pink-400 fill-current animate-pulse" />
                            <h3 className="text-lg font-bold text-white font-mplus">
                                Memories
                            </h3>
                        </div>
                        <span className="text-xs font-bold bg-white/10 text-pink-200 px-3 py-1 rounded-full">
                            {audios.length} MOMENTS
                        </span>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-pink-300/30 scrollbar-track-transparent">
                        {audios.map((audio, index) => {
                            const isPlaying = currentId === audio.id
                            return (
                                <button
                                    key={audio.id}
                                    onClick={() => handlePlay(audio.id)}
                                    className={`
                                        group w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden kawaii-btn
                                        ${isPlaying
                                            ? 'bg-gradient-to-r from-pink-500/80 to-purple-600/80 border-pink-300/50 shadow-lg scale-[1.02]'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-pink-300/30'
                                        }
                                    `}
                                >

                                    <div className="flex items-center min-w-0 flex-1 mr-4 z-10">
                                        <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 transition-colors
                                            ${isPlaying ? 'bg-white text-pink-500' : 'bg-white/10 text-white/50 group-hover:bg-pink-400 group-hover:text-white'}
                                        `}>
                                            <PlayIcon isPlaying={isPlaying} />
                                        </div>

                                        <div className="flex flex-col items-start truncate">
                                            <span className={`text-base font-bold transition-colors duration-300 truncate w-full text-left font-mplus ${isPlaying ? 'text-white' : 'text-slate-200 group-hover:text-pink-200'}`}>
                                                {audio.title}
                                            </span>
                                            <span className="text-[11px] text-white/40 mt-0.5 flex items-center font-bold tracking-wide group-hover:text-white/60 transition-colors">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(audio.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={`text-xs font-bold font-mono z-10 ${isPlaying ? 'text-white/80' : 'text-slate-500'}`}>
                                        {Math.round(audio.duration_ms / 1000)}s
                                    </div>

                                    {/* Hover Sparkle Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center pb-8 opacity-40 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white/50 font-mplus font-bold tracking-widest">
                        POWERED BY NFC SHIORI
                    </p>
                </div>
            </div>
        </div>
    )
}

const PlayIcon = ({ isPlaying }: { isPlaying: boolean }) => {
    if (isPlaying) {
        return (
            <div className="flex space-x-[2px] items-end h-3">
                <div className="w-1 bg-current animate-[bounce_1s_infinite] h-2"></div>
                <div className="w-1 bg-current animate-[bounce_1.2s_infinite] h-3"></div>
                <div className="w-1 bg-current animate-[bounce_0.8s_infinite] h-1"></div>
            </div>
        )
    }
    return <Play className="w-4 h-4 fill-current ml-0.5" />
}

function Play({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
        </svg>
    )
}
