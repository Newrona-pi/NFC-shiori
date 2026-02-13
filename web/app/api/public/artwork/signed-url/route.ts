import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { tagId } = body

    if (!tagId) {
        return NextResponse.json({ error: 'Tag ID required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { data: tag } = await serviceClient
        .from('tags')
        .select('artwork_path')
        .eq('id', tagId)
        .single()

    if (!tag?.artwork_path) {
        return NextResponse.json({ artworkUrl: null })
    }

    const { data, error } = await serviceClient
        .storage
        .from('artworks')
        .createSignedUrl(tag.artwork_path, 60 * 60) // 1 hour validity

    if (error) {
        return NextResponse.json({ artworkUrl: null })
    }

    return NextResponse.json({ artworkUrl: data.signedUrl })
}
