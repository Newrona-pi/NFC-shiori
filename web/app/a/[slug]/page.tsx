import { redirect } from 'next/navigation'
import { ListenerView } from './listener-view'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ListenerPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const serviceClient = createServiceClient()

    const { data: tag, error } = await serviceClient
        .from('tags')
        .select('id, display_name, slug')
        .eq('slug', slug)
        .single()

    if (error) {
        console.error('Listener page query error:', error, 'slug:', slug)
    }

    if (!tag) {
        redirect('/error?msg=tag_not_found')
    }

    const { data: audios } = await serviceClient
        .from('audios')
        .select('id, title, duration_ms, created_at')
        .eq('tag_id', tag.id)
        .order('created_at', { ascending: false })

    return (
        <ListenerView
            tag={tag}
            audios={audios || []}
            latestAudioId={audios?.[0]?.id || null}
        />
    )
}
