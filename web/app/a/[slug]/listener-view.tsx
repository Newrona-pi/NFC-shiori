'use client'

import { useState } from 'react'
import { AudioPlayer } from '@/components/audio-player'
import { Clock, Calendar, Heart, Music, Sparkles } from 'lucide-react'

// Cute floating shape (adjusted for light theme)
const Blob = ({ color, top, left, delay, size }: any) => (
    <div
        className={`absolute rounded-full filter blur-[60px] opacity-30 animate-float-slow`}
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
        <div className="min-h-screen bg-transparent text-slate-700 font-sans overflow-hidden relative selection:bg-pink-300 selection:text-white">

            {/* Dreamy Background Blobs */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <Blob color="#ffd6e7" top="-10%" left="-10%" size="600px" delay="0s" />
                <Blob color="#d4f0f0" top="40%" right="-20%" size="500px" delay="3s" />
                <Blob color="#e6e6fa" bottom="-10%" left="20%" size="400px" delay="5s" />

                {/* Subtle texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-multiply"></div>
            </div>

            <div className="relative z-10 max-w-lg mx-auto px-6 py-12 flex flex-col items-center min-h-screen">

                {/* Brand / Header */}
                <div className="mb-10 text-center transform transition-transform duration-500 hover:scale-105">
                    <div className="inline-flex items-center justify-center bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/50 mb-4 shadow-sm animate-float-slow text-pink-400">
                        <Sparkles className="w-4 h-4 mr-2" />
                        <span className="text-xs font-bold tracking-widest uppercase">Secret Message</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 drop-shadow-sm font-mplus leading-tight pb-2">
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
                        <div className="flex flex-col items-center justify-center h-64 w-full rounded-[40px] bg-white/40 border-2 border-dashed border-pink-200 text-pink-300 backdrop-blur-sm">
                            <Music className="w-12 h-12 mb-4 opacity-50 animate-bounce" />
                            <span className="font-mplus font-bold text-lg">まだメッセージがありません...</span>
                        </div>
                    )}
                </div>

                {/* Archive List (Memories) */}
                <div className="w-full bg-white/40 backdrop-blur-md rounded-[32px] border border-white/60 p-6 shadow-lg shadow-purple-500/5">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center space-x-2 text-purple-600">
                            <Heart className="w-5 h-5 fill-current animate-pulse text-pink-400" />
                            <h3 className="text-lg font-bold font-mplus">
                                思い出の記録
                            </h3>
                        </div>
                        <span className="text-xs font-bold bg-white text-pink-400 px-3 py-1 rounded-full shadow-sm border border-pink-100">
                            {audios.length} 件
                        </span>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent">
                        {audios.map((audio, index) => {
                            const isPlaying = currentId === audio.id
                            return (
                                <button
                                    key={audio.id}
                                    onClick={() => handlePlay(audio.id)}
                                    className={`
                                        group w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden kawaii-btn
                                        ${isPlaying
                                            ? 'bg-gradient-to-r from-pink-100 to-purple-100 border-pink-300 shadow-md scale-[1.02]'
                                            : 'bg-white/60 border-white/50 hover:bg-white/80 hover:border-pink-200 hover:shadow-sm'
                                        }
                                    `}
                                >

                                    <div className="flex items-center min-w-0 flex-1 mr-4 z-10">
                                        <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 transition-colors shadow-sm
                                            ${isPlaying ? 'bg-pink-400 text-white' : 'bg-white text-pink-300 group-hover:bg-pink-400 group-hover:text-white'}
                                        `}>
                                            <PlayIcon isPlaying={isPlaying} />
                                        </div>

                                        <div className="flex flex-col items-start truncate">
                                            <span className={`text-base font-bold transition-colors duration-300 truncate w-full text-left font-mplus ${isPlaying ? 'text-purple-600' : 'text-slate-600 group-hover:text-purple-500'}`}>
                                                {audio.title}
                                            </span>
                                            <span className="text-[11px] text-slate-400 mt-0.5 flex items-center font-bold tracking-wide group-hover:text-slate-500 transition-colors">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(audio.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={`text-xs font-bold font-mono z-10 ${isPlaying ? 'text-purple-500' : 'text-slate-400'}`}>
                                        {Math.round(audio.duration_ms / 1000)}s
                                    </div>

                                    {/* Hover Sparkle Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center pb-8 opacity-60 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-slate-400 font-mplus font-bold tracking-widest">
                        Provided by NFCシオリ
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
