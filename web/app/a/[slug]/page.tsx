import { redirect } from 'next/navigation'
import { ListenerView } from './listener-view'

// For Public Access Mode (No SDM / No Cookie required)

export default async function ListenerPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    // Fetch Tag & Audios (Service Role)
    // We use service role because 'audios' table might be protected by RLS (only owners can see).
    // But here we want public access for listeners.
    const { createClient } = require('@supabase/supabase-js')
    const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: tag } = await serviceClient
        .from('tags')
        .select('id, display_name, slug, current_audio_id')
        .eq('slug', slug)
        .single()

    if (!tag) {
        redirect('/error?msg=tag_not_found')
    }

    const { data: audios } = await serviceClient
        .from('audios')
        .select('id, title, duration_ms, created_at')
        .eq('tag_id', tag.id)
        .order('created_at', { ascending: false })

    // No security check against cookie tagId because we allow direct access.

    return (
        <ListenerView
            tag={tag}
            audios={audios || []}
            latestAudioId={tag.current_audio_id || (audios && audios[0]?.id) || null}
        />
    )
}
