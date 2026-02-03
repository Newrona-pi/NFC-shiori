import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')

export async function POST(req: NextRequest) {
    // Verify NFC session cookie
    const cookie = req.cookies.get('nfc_session')
    if (!cookie) {
        return NextResponse.json({ error: 'Session missing. Please tap the NFC tag.' }, { status: 401 })
    }

    let tagId: string

    try {
        const { payload } = await jwtVerify(cookie.value, SECRET)
        tagId = payload.tagId as string
    } catch (e) {
        return NextResponse.json({ error: 'Session expired. Please tap the tag again.' }, { status: 401 })
    }

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

    // Verify the audio belongs to the tag in the session
    if (audio.tag_id !== tagId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
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
