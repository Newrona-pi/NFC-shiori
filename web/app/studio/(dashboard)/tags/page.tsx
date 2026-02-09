import { createClient } from '@/lib/supabase/server'
import { createTag } from '@/app/studio/actions'
import Link from 'next/link'
import { Plus, Heart, Music, Sparkles, Tag as TagIcon, ArrowRight } from 'lucide-react'

export default async function TagsPage() {
    const supabase = await createClient()
    const { data: tags } = await supabase.from('tags').select('*').order('created_at', { ascending: false })

    return (
        <div className="space-y-12">

            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-2 animate-float-slow backdrop-blur-md border border-white/20 shadow-lg">
                    <Sparkles className="w-6 h-6 text-yellow-300 mr-2" />
                    <span className="font-mplus font-bold text-white tracking-widest uppercase">Secret Collection</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-[0_2px_15px_rgba(255,154,235,0.6)] font-mplus">
                    Interactive Tags
                </h2>
                <p className="text-pink-200/80 font-mplus max-w-lg mx-auto">
                    Manage your magic NFC tags and deliver special voice moments to your fans.
                </p>
            </div>

            {/* Create New Tag Card */}
            <div className="max-w-3xl mx-auto">
                <div className="kawaii-card p-8 relative overflow-hidden group hover:shadow-[0_0_40px_rgba(137,207,240,0.4)] transition-shadow duration-500">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-20 blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>

                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <Plus className="w-6 h-6 mr-2 text-cyan-300 p-1 bg-white/10 rounded-full" />
                        Create New Tag
                    </h3>

                    <form action={createTag as any} className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 w-full space-y-2">
                            <label htmlFor="slug" className="block text-sm font-bold text-cyan-200 ml-1">Slug (URL ID)</label>
                            <input
                                name="slug"
                                id="slug"
                                placeholder="my-event-2024"
                                required
                                pattern="[a-z0-9\-]+"
                                className="w-full bg-black/20 border-2 border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all font-mono text-sm shadow-inner"
                            />
                            <p className="text-[10px] text-white/40 ml-2 flex items-center">
                                <span className="w-1 h-1 bg-cyan-400 rounded-full mr-1"></span>
                                lowercase, numbers, hyphens only
                            </p>
                        </div>

                        <div className="flex-1 w-full space-y-2">
                            <label htmlFor="display_name" className="block text-sm font-bold text-pink-200 ml-1">Display Name</label>
                            <input
                                name="display_name"
                                id="display_name"
                                placeholder="Birthday Voice 2024"
                                required
                                className="w-full bg-black/20 border-2 border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all font-mplus shadow-inner"
                            />
                        </div>

                        <div className="w-full md:w-auto">
                            <button
                                type="submit"
                                className="w-full md:w-auto bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold py-3.5 px-8 rounded-full shadow-lg hover:shadow-cyan-400/40 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center kawaii-btn"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Tag Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto pb-20">
                {tags?.map((tag: any) => (
                    <Link key={tag.id} href={`/studio/tags/${tag.id}`} className="block group perspective-1000">
                        <div className="kawaii-card h-full p-6 relative overflow-hidden transition-all duration-500 group-hover:transform group-hover:-translate-y-2 group-hover:rotate-1 group-hover:shadow-[0_10px_30px_-10px_rgba(255,154,235,0.4)] bg-white/5 border-white/10 group-hover:border-pink-300/30">

                            {/* Card Background Decoration */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-bl-[60px] transition-all duration-500 group-hover:bg-pink-500/20"></div>

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-2xl ${tag.current_audio_id ? 'bg-gradient-to-br from-pink-400 to-purple-500 shadow-md animate-pulse-slow' : 'bg-white/10 text-white/50'}`}>
                                        {tag.current_audio_id ? <Music className="w-6 h-6 text-white" /> : <TagIcon className="w-6 h-6" />}
                                    </div>
                                    {tag.current_audio_id && (
                                        <div className="bg-green-400/20 text-green-300 text-[10px] font-bold px-2 py-1 rounded-full border border-green-400/30 flex items-center shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                                            ACTIVE
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1 font-mplus truncate group-hover:text-pink-200 transition-colors">
                                    {tag.display_name}
                                </h3>
                                <p className="text-sm text-white/40 font-mono truncate mb-6 pl-1 border-l-2 border-white/10 group-hover:border-cyan-400 transition-colors">
                                    /{tag.slug}
                                </p>

                                <div className="flex items-center justify-between text-xs text-white/30 font-bold border-t border-white/10 pt-4 group-hover:border-white/20 transition-colors">
                                    <span>{new Date(tag.created_at).toLocaleDateString()}</span>
                                    <span className="flex items-center text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                        Manage <ArrowRight className="w-3 h-3 ml-1" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

                {tags?.length === 0 && (
                    <div className="col-span-full text-center py-20 kawaii-card bg-white/5 border-dashed border-2 border-white/10 rounded-3xl">
                        <Heart className="w-16 h-16 text-pink-300/30 mx-auto mb-4 animate-bounce" />
                        <h3 className="text-xl font-bold text-white/50 font-mplus mb-2">No Memories Yet</h3>
                        <p className="text-white/30 text-sm">Create your first tag above to start the magic!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
