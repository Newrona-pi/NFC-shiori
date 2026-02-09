import { createClient } from '@/lib/supabase/server'
import { createTag } from '@/app/studio/actions'
import Link from 'next/link'
import { Plus, Heart, Music, Sparkles, Tag as TagIcon, ArrowRight } from 'lucide-react'

export default async function TagsPage() {
    const supabase = await createClient()
    const { data: tags } = await supabase.from('tags').select('*').order('created_at', { ascending: false })

    return (
        <div className="space-y-12 pb-20">

            {/* Header Section */}
            <div className="text-center space-y-4 pt-4">
                <div className="inline-flex items-center justify-center p-3 bg-white/60 rounded-full mb-2 animate-float-slow backdrop-blur-md border border-white/80 shadow-sm text-pink-400">
                    <Sparkles className="w-6 h-6 mr-2" />
                    <span className="font-mplus font-bold tracking-widest uppercase">Secret Collection</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-[#5d5d8d] drop-shadow-sm font-mplus">
                    タグ一覧
                </h2>
                <p className="text-slate-500 font-mplus max-w-lg mx-auto">
                    魔法のNFCタグを管理して、あなただけの特別な声を届けましょう。
                </p>
            </div>

            {/* Create New Tag Card */}
            <div className="max-w-3xl mx-auto">
                <div className="kawaii-card p-8 relative overflow-hidden group hover:shadow-[0_0_40px_rgba(255,183,227,0.3)] transition-shadow duration-500 bg-white/70">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full opacity-40 blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>

                    <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center">
                        <Plus className="w-6 h-6 mr-2 text-pink-400 p-1 bg-white rounded-full shadow-sm" />
                        新しいタグを作成
                    </h3>

                    <form action={createTag as any} className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 w-full space-y-2">
                            <label htmlFor="slug" className="block text-sm font-bold text-slate-500 ml-1">Slug (URL ID)</label>
                            <input
                                name="slug"
                                id="slug"
                                placeholder="my-event-2024"
                                required
                                pattern="[a-z0-9\-]+"
                                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-700 placeholder-slate-300 focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all font-mono text-sm shadow-inner"
                            />
                            <p className="text-[10px] text-slate-400 ml-2 flex items-center">
                                <span className="w-1.5 h-1.5 bg-pink-300 rounded-full mr-1"></span>
                                英小文字、数字、ハイフンのみ
                            </p>
                        </div>

                        <div className="flex-1 w-full space-y-2">
                            <label htmlFor="display_name" className="block text-sm font-bold text-slate-500 ml-1">表示名</label>
                            <input
                                name="display_name"
                                id="display_name"
                                placeholder="お誕生日ボイス2024"
                                required
                                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-700 placeholder-slate-300 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100 transition-all font-mplus shadow-inner"
                            />
                        </div>

                        <div className="w-full md:w-auto">
                            <button
                                type="submit"
                                className="w-full md:w-auto bg-gradient-to-r from-pink-300 to-purple-300 text-white font-bold py-3.5 px-8 rounded-full shadow-lg hover:shadow-pink-200 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center kawaii-btn"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                作成
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Tag Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-7xl mx-auto">
                {tags?.map((tag: any) => (
                    <Link key={tag.id} href={`/studio/tags/${tag.id}`} className="block group perspective-1000">
                        <div className="kawaii-card h-full p-6 relative overflow-hidden transition-all duration-500 group-hover:transform group-hover:-translate-y-2 group-hover:rotate-1 group-hover:shadow-[0_10px_30px_-10px_rgba(162,210,255,0.4)] bg-white/60 border-white/80 group-hover:border-pink-200">

                            {/* Card Background Decoration */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-100 rounded-bl-[60px] transition-all duration-500 group-hover:bg-pink-200 opacity-50"></div>

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-2xl ${tag.current_audio_id ? 'bg-gradient-to-br from-pink-300 to-purple-300 shadow-md animate-heartbeat text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        {tag.current_audio_id ? <Music className="w-6 h-6" /> : <TagIcon className="w-6 h-6" />}
                                    </div>
                                    {tag.current_audio_id && (
                                        <div className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full border border-green-200 flex items-center shadow-sm">
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                                            公開中
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-slate-700 mb-1 font-mplus truncate group-hover:text-pink-400 transition-colors">
                                    {tag.display_name}
                                </h3>
                                <p className="text-sm text-slate-400 font-mono truncate mb-6 pl-1 border-l-2 border-slate-200 group-hover:border-purple-300 transition-colors">
                                    /{tag.slug}
                                </p>

                                <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-t border-slate-100 pt-4 group-hover:border-pink-100 transition-colors">
                                    <span>{new Date(tag.created_at).toLocaleDateString()}</span>
                                    <span className="flex items-center text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                        編集 <ArrowRight className="w-3 h-3 ml-1" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

                {tags?.length === 0 && (
                    <div className="col-span-full text-center py-20 kawaii-card bg-white/40 border-dashed border-2 border-pink-100 rounded-3xl">
                        <Heart className="w-16 h-16 text-pink-200 mx-auto mb-4 animate-bounce" />
                        <h3 className="text-xl font-bold text-slate-400 font-mplus mb-2">まだタグがありません</h3>
                        <p className="text-slate-400 text-sm">上のフォームから最初のタグを作成して、魔法を始めましょう！</p>
                    </div>
                )}
            </div>
        </div>
    )
}
