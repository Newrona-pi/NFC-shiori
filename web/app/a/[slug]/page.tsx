import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { ListenerView } from './listener-view'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')

export default async function ListenerPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    // Verify NFC session cookie (issued by /api/tap after SDM verification)
    const cookieStore = await cookies()
    const token = cookieStore.get('nfc_session')

    if (!token) {
        redirect('/error?msg=please_tap_tag')
    }

    let tagId: string

    try {
        const { payload } = await jwtVerify(token.value, SECRET)
        tagId = payload.tagId as string
    } catch (e) {
        redirect('/error?msg=session_expired')
    }

    // Fetch Tag & Audios (Service Role)
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

    // Security Check: Ensure the token's tagId matches the requested slug's tagId
    if (tag.id !== tagId) {
        redirect('/error?msg=invalid_tag')
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
            latestAudioId={tag.current_audio_id || (audios && audios[0]?.id) || null}
        />
    )
}
