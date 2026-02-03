import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')

export async function POST(req: NextRequest) {
    // 1. Verify Cookie
    const cookie = req.cookies.get('nfc_session')
    if (!cookie) {
        return NextResponse.json({ error: 'Session missing' }, { status: 401 })
    }

    try {
        const { payload } = await jwtVerify(cookie.value, SECRET)
        const tagId = payload.tagId as string

        // 2. Parse Body
        const body = await req.json()
        const { audioId } = body

        if (!audioId) {
            return NextResponse.json({ error: 'Audio ID required' }, { status: 400 })
        }

        // 3. Verify Audio belongs to Tag
        // We need service role to check 'audios' if RLS blocks (site A is anon).
        // Site A user is NOT authenticated via Supabase Auth, they are Anon.
        // So 'createClient()' uses Anon key.
        // Anon cannot read 'audios' because of RLS: "Owners can view...".
        // So we need SERVICE ROLE here.

        const { createClient: createServiceClient } = require('@supabase/supabase-js')
        const serviceClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: audio } = await serviceClient
            .from('audios')
            .select('id, storage_path, tag_id')
            .eq('id', audioId)
            .single()

        if (!audio || audio.tag_id !== tagId) {
            return NextResponse.json({ error: 'Audio not found or mismatch' }, { status: 403 })
        }

        // 4. Generate Signed URL
        const { data, error } = await serviceClient
            .storage
            .from('audios')
            .createSignedUrl(audio.storage_path, 60 * 60) // 1 hour validity

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ signedUrl: data.signedUrl })

    } catch (e) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }
}
