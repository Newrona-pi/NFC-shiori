import { redirect } from 'next/navigation'
import { getStudioSession } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { FileUploader } from './file-uploader'
import { updateDisplayName } from './actions'
import { Clock, Calendar, Music, Link as LinkIcon } from 'lucide-react'

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
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {tag.display_name || 'マイチャンネル'}
        </h1>
        <p className="text-sm text-[var(--s-text-muted)] mt-1">
          オーディオの管理・アップロード
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Settings */}
        <div className="space-y-5">
          {/* Display Name */}
          <div className="s-card p-5">
            <h3 className="text-xs font-medium text-[var(--s-text-muted)] uppercase tracking-wider mb-3">
              表示名
            </h3>
            <form action={updateDisplayName} className="flex gap-2">
              <input type="hidden" name="tagId" value={tag.id} />
              <input
                name="display_name"
                defaultValue={tag.display_name || ''}
                placeholder="チャンネル名"
                className="s-input flex-1 text-sm"
              />
              <button type="submit" className="s-btn s-btn-primary text-xs">
                保存
              </button>
            </form>
          </div>

          {/* NFC URL */}
          <div className="s-card p-5">
            <h3 className="text-xs font-medium text-[var(--s-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" />
              リスナーURL
            </h3>
            <div className="bg-[var(--s-bg)] border border-[var(--s-border)] rounded-lg p-3 text-xs font-mono text-[var(--s-text-muted)] break-all select-all">
              {listenerUrl}
            </div>
            <p className="text-[11px] text-[var(--s-text-muted)] mt-2 opacity-60">
              NFCタグにNDEF URIとして書き込むURL
            </p>
          </div>

          {/* Upload */}
          <FileUploader tagId={tag.id} />
        </div>

        {/* Right Column — Audio History */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--s-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" />
              オーディオ
            </h3>
            {audios && audios.length > 0 && (
              <span className="text-xs text-[var(--s-text-muted)]">
                {audios.length} 件
              </span>
            )}
          </div>

          <div className="space-y-2">
            {audios?.map((audio, index) => (
              <div
                key={audio.id}
                className={`s-card p-4 flex items-center justify-between transition-all duration-200 ${
                  latestAudioId === audio.id
                    ? 'border-[var(--s-accent)]/40'
                    : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center min-w-0 flex-1 mr-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mr-3 shrink-0 ${
                    latestAudioId === audio.id
                      ? 'bg-[var(--s-accent)]/15 text-[var(--s-accent)]'
                      : 'bg-[var(--s-surface-hover)] text-[var(--s-text-muted)]'
                  }`}>
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-[var(--s-text)] truncate">
                      {audio.title}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-[var(--s-text-muted)] mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.round((audio.duration_ms || 0) / 1000)}s
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(audio.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                </div>
                {latestAudioId === audio.id && (
                  <span className="text-[11px] font-medium bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    公開中
                  </span>
                )}
              </div>
            ))}

            {!audios?.length && (
              <div className="s-card border-dashed p-12 text-center">
                <Music className="w-8 h-8 text-[var(--s-text-muted)] mx-auto mb-3 opacity-30" />
                <p className="text-sm text-[var(--s-text-muted)]">
                  まだオーディオがありません
                </p>
                <p className="text-xs text-[var(--s-text-muted)] mt-1 opacity-60">
                  左のフォームからアップロードしてください
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
