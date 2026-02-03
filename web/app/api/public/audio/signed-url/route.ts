import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    // MVP Phase 1: No cookie verification required.
    // Anyone with the audioId can get a signed URL.

    // Parse Body
    const body = await req.json()
    const { audioId } = body

    if (!audioId) {
        return NextResponse.json({ error: 'Audio ID required' }, { status: 400 })
    }

    // Use SERVICE ROLE to bypass RLS
    const { createClient: createServiceClient } = require('@supabase/supabase-js')
    const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: audio, error: audioError } = await serviceClient
        .from('audios')
        .select('id, storage_path, tag_id')
        .eq('id', audioId)
        .single()

    if (audioError || !audio) {
        return NextResponse.json({ error: 'Audio not found' }, { status: 404 })
    }

    // Generate Signed URL
    const { data, error } = await serviceClient
        .storage
        .from('audios')
        .createSignedUrl(audio.storage_path, 60 * 60) // 1 hour validity

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ signedUrl: data.signedUrl })
}
