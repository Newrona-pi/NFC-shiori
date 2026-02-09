'use client'

import { useState } from 'react'
import { AudioPlayer } from '@/components/audio-player'
import { Clock, Calendar, Sparkles } from 'lucide-react'

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
        // Prevent auto-play triggering immediately if same ID clicked?
        if (currentId !== id) {
            setCurrentId(id)
            setAutoPlay(true)
        }
    }

    const currentAudio = audios.find(a => a.id === currentId)

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans overflow-hidden relative">

            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0">
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute top-1/2 -right-32 w-80 h-80 bg-cyan-500 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 max-w-md mx-auto px-6 py-12 flex flex-col items-center min-h-screen">

                {/* Header / Brand */}
                <div className="mb-12 text-center transform hover:scale-105 transition-transform duration-500">
                    <h1 className="text-4xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-400 drop-shadow-[0_0_15px_rgba(0,255,242,0.5)] font-outfit">
                        {tag.display_name}
                    </h1>
                    <div className="mt-2 flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#00ff00]"></span>
                        <p className="text-cyan-200/50 text-xs font-mono tracking-[0.2em] uppercase">
                            Secure Connection Established
                        </p>
                    </div>
                </div>

                {/* Main Player Area */}
                <div className="w-full mb-12">
                    {currentId ? (
                        <div className="transform transition-all duration-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] rounded-3xl">
                            <AudioPlayer
                                audioId={currentId}
                                autoPlay={autoPlay}
                                title={currentAudio?.title}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 w-full rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-500 backdrop-blur-sm">
                            <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                            <span className="font-mono text-xs uppercase tracking-widest">No Signal Received</span>
                        </div>
                    )}
                </div>

                {/* Archive List / Data Log */}
                <div className="w-full space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
                        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-outfit shadow-cyan- glow">
                            Transmission Log
                        </h3>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-400 font-mono">
                            {audios.length} FILES
                        </span>
                    </div>

                    <div className="space-y-3 pb-20">
                        {audios.map((audio, index) => {
                            const isPlaying = currentId === audio.id
                            return (
                                <button
                                    key={audio.id}
                                    onClick={() => handlePlay(audio.id)}
                                    className={`
                                        group w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 relative overflow-hidden
                                        ${isPlaying
                                            ? 'bg-gradient-to-r from-purple-900/60 to-slate-900/60 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)] translate-x-1'
                                            : 'bg-slate-900/40 border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800/60'
                                        }
                                    `}
                                >
                                    {/* Active Indicator Line */}
                                    {isPlaying && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-purple-500 shadow-[0_0_10px_#00fff2]" />
                                    )}

                                    <div className="flex flex-col items-start truncate mr-4 z-10 pl-2">
                                        <span className={`text-sm font-medium transition-colors duration-300 truncate font-zen ${isPlaying ? 'text-white' : 'text-slate-300 group-hover:text-cyan-200'}`}>
                                            {audio.title}
                                        </span>
                                        <span className="text-[10px] text-slate-500 mt-1 flex items-center font-mono uppercase tracking-wide group-hover:text-slate-400 transition-colors">
                                            <Calendar className="w-3 h-3 mr-1 opacity-70" />
                                            {new Date(audio.created_at).toLocaleDateString()}
                                            <span className="mx-2 opacity-30">|</span>
                                            LOG #{audios.length - index}
                                        </span>
                                    </div>

                                    <div className="flex items-center text-xs font-mono text-slate-500 z-10">
                                        <Clock className="w-3 h-3 mr-1 opacity-70" />
                                        {Math.round(audio.duration_ms / 1000)}s
                                    </div>

                                    {/* Hover Glitch Effect (Subtle) */}
                                    <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
