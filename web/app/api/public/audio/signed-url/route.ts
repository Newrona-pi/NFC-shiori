import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    // 1. Parse Body
    const body = await req.json()
    const { audioId } = body

    if (!audioId) {
        return NextResponse.json({ error: 'Audio ID required' }, { status: 400 })
    }

    // 2. Fetch Audio & Generate Signed URL (Service Role)
    const serviceClient = createServiceClient()

    const { data: audio, error: audioError } = await serviceClient
        .from('audios')
        .select('id, storage_path, tag_id')
        .eq('id', audioId)
        .single()

    if (audioError || !audio) {
        return NextResponse.json({ error: 'Audio not found' }, { status: 404 })
    }

    // 3. Generate Signed URL
    const { data, error } = await serviceClient
        .storage
        .from('audios')
        .createSignedUrl(audio.storage_path, 60 * 60) // 1 hour validity

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ signedUrl: data.signedUrl })
}
