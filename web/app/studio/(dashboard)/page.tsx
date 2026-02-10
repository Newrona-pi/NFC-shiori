import { redirect } from 'next/navigation'
import { getStudioSession } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { FileUploader } from './file-uploader'
import { updateDisplayName } from './actions'
import { Clock, Calendar, Music, Sparkles, Link as LinkIcon, Heart } from 'lucide-react'

export default async function StudioDashboardPage() {
  const session = await getStudioSession()
  if (!session) redirect('/studio/login')

  const supabase = createServiceClient()

  const { data: tag } = await supabase
    .from('tags')
    .select('id, slug, display_name, password_hash, created_at')
    .eq('slug', session.slug)
    .single()

  if (!tag) redirect('/studio/login')

  const { data: audios } = await supabase
    .from('audios')
    .select('*')
    .eq('tag_id', tag.id)
    .order('created_at', { ascending: false })

  const latestAudioId = audios?.[0]?.id || null
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000'
  const listenerUrl = `${baseUrl}/a/${tag.slug}`

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center justify-center p-3 bg-white/60 rounded-full mb-2 animate-float-slow backdrop-blur-md border border-white/80 shadow-sm text-pink-400">
          <Sparkles className="w-6 h-6 mr-2" />
          <span className="font-mplus font-bold tracking-widest uppercase">My Channel</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-[#5d5d8d] drop-shadow-sm font-mplus">
          {tag.display_name || 'マイチャンネル'}
        </h2>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Display Name Edit */}
          <div className="kawaii-card p-6 bg-white/70">
            <h3 className="text-sm font-bold text-slate-500 mb-3">表示名</h3>
            <form action={updateDisplayName} className="flex gap-2">
              <input type="hidden" name="tagId" value={tag.id} />
              <input
                name="display_name"
                defaultValue={tag.display_name || ''}
                placeholder="チャンネル名..."
                className="flex-1 bg-white border-2 border-slate-100 rounded-2xl px-3 py-2 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all font-mplus"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-300 to-purple-300 text-white font-bold py-2 px-4 rounded-full text-sm shadow hover:scale-105 active:scale-95 transition-all kawaii-btn"
              >
                保存
              </button>
            </form>
          </div>

          {/* NFC URL */}
          <div className="kawaii-card p-6 bg-white/70">
            <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center">
              <LinkIcon className="w-4 h-4 mr-2 text-pink-400" />
              NFCタグに書き込むURL
            </h3>
            <div className="bg-white border-2 border-slate-100 rounded-2xl p-3 text-xs font-mono text-slate-600 break-all select-all">
              {listenerUrl}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 ml-1">
              このURLをNFCタグにNDEF URIとして書き込んでください
            </p>
          </div>

          {/* Upload */}
          <FileUploader tagId={tag.id} />
        </div>

        {/* Right Column: Audio History */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-[#5d5d8d] font-mplus flex items-center">
            <Music className="w-5 h-5 mr-2 text-pink-400" />
            オーディオ履歴
          </h3>

          <div className="space-y-3">
            {audios?.map((audio) => (
              <div
                key={audio.id}
                className="kawaii-card p-4 bg-white/60 flex items-center justify-between"
              >
                <div className="flex items-center min-w-0 flex-1 mr-4">
                  <div className={`p-2 rounded-xl mr-3 shrink-0 ${latestAudioId === audio.id ? 'bg-gradient-to-br from-pink-300 to-purple-300 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                    <Music className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-slate-700 truncate font-mplus">{audio.title}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {Math.round((audio.duration_ms || 0) / 1000)}s
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(audio.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                {latestAudioId === audio.id && (
                  <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-1 rounded-full border border-green-200 flex items-center shrink-0">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                    公開中
                  </span>
                )}
              </div>
            ))}

            {!audios?.length && (
              <div className="text-center py-16 kawaii-card bg-white/40 border-dashed border-2 border-pink-100 rounded-3xl">
                <Heart className="w-12 h-12 text-pink-200 mx-auto mb-3 animate-bounce" />
                <h3 className="text-lg font-bold text-slate-400 font-mplus mb-1">まだオーディオがありません</h3>
                <p className="text-slate-400 text-sm">左のフォームからアップロードしましょう！</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
