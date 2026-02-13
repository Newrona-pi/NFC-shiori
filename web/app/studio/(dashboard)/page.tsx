import { redirect } from 'next/navigation'
import { getStudioSession } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { FileUploader } from './file-uploader'
import { updateDisplayName } from './actions'
import { Clock, Music, Link as LinkIcon } from 'lucide-react'

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
    <div className="space-y-4">
      {/* Row 1: Settings — Display name + NFC URL */}
      <div className="s-card p-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <form action={updateDisplayName} className="flex gap-2 flex-1 min-w-0">
          <input type="hidden" name="tagId" value={tag.id} />
          <input
            name="display_name"
            defaultValue={tag.display_name || ''}
            placeholder="チャンネル名"
            className="s-input flex-1 text-sm min-w-0"
          />
          <button type="submit" className="s-btn s-btn-primary text-xs shrink-0">
            保存
          </button>
        </form>
        <div className="flex items-center gap-2 sm:border-l sm:border-[var(--s-border)] sm:pl-3 min-w-0">
          <LinkIcon className="w-3.5 h-3.5 text-[var(--s-text-muted)] shrink-0" />
          <code className="text-[11px] text-[var(--s-text-muted)] truncate select-all" title={listenerUrl}>
            {listenerUrl}
          </code>
        </div>
      </div>

      {/* Row 2: Upload */}
      <FileUploader tagId={tag.id} />

      {/* Row 3: Audio list */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs font-medium text-[var(--s-text-muted)] uppercase tracking-wider">
            オーディオ
          </span>
          {audios && audios.length > 0 && (
            <span className="text-[11px] text-[var(--s-text-muted)]">
              {audios.length}件
            </span>
          )}
        </div>

        {audios && audios.length > 0 ? (
          <div className="s-card divide-y divide-[var(--s-border)]">
            {audios.map((audio) => (
              <div
                key={audio.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--s-surface-hover)] transition-colors"
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                  latestAudioId === audio.id
                    ? 'bg-[var(--s-accent)]/15 text-[var(--s-accent)]'
                    : 'bg-[var(--s-surface-hover)] text-[var(--s-text-muted)]'
                }`}>
                  <Music className="w-3.5 h-3.5" />
                </div>

                <p className="text-sm text-[var(--s-text)] truncate flex-1 min-w-0">
                  {audio.title}
                </p>

                <span className="text-[11px] text-[var(--s-text-muted)] tabular-nums shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.round((audio.duration_ms || 0) / 1000)}s
                </span>

                <span className="text-[11px] text-[var(--s-text-muted)] tabular-nums shrink-0 hidden sm:block">
                  {new Date(audio.created_at).toLocaleDateString('ja-JP')}
                </span>

                {latestAudioId === audio.id ? (
                  <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 shrink-0">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                    公開中
                  </span>
                ) : (
                  <span className="w-[52px] shrink-0" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="s-card px-4 py-8 text-center">
            <p className="text-sm text-[var(--s-text-muted)]">
              オーディオがありません
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
