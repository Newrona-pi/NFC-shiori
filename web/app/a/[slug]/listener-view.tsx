'use client'

import { useState } from 'react'
import { AudioPlayer } from '@/components/audio-player'
import { Play, Clock, Calendar } from 'lucide-react'

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
    // If we switch audio, we want autoplay to likely happen?
    const [autoPlay, setAutoPlay] = useState(true)

    const handlePlay = (id: string) => {
        setCurrentId(id)
        setAutoPlay(true)
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
            <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">{tag.display_name}</h1>
                    <p className="text-slate-400 text-sm">Exclusive NFC Content</p>
                </div>

                <div className="mb-10">
                    {currentId ? (
                        <AudioPlayer audioId={currentId} autoPlay={autoPlay} />
                    ) : (
                        <div className="flex items-center justify-center h-48 rounded-2xl bg-slate-800 border border-slate-700 text-slate-500">
                            No audio available
                        </div>
                    )}
                    {currentId && audios.find(a => a.id === currentId) && (
                        <div className="mt-4 text-center">
                            <h2 className="text-lg font-medium text-white">
                                {audios.find(a => a.id === currentId)?.title}
                            </h2>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Archive</h3>
                    <div className="space-y-2">
                        {audios.map((audio) => (
                            <button
                                key={audio.id}
                                onClick={() => handlePlay(audio.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-lg transition-all ${currentId === audio.id
                                        ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50'
                                        : 'bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex flex-col items-start truncate mr-4">
                                    <span className={`text-sm font-medium ${currentId === audio.id ? 'text-white' : 'text-slate-200'} truncate`}>
                                        {audio.title}
                                    </span>
                                    <span className="text-xs text-slate-400 mt-1 flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(audio.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center text-xs text-slate-400">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {Math.round(audio.duration_ms / 1000)}s
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
