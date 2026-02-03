import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CommitSchema = z.object({
    tagId: z.string().uuid(),
    storagePath: z.string().min(1),
    title: z.string().min(1),
    mimeType: z.string(),
    sizeBytes: z.number(),
    durationMs: z.number().optional()
})

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = CommitSchema.safeParse(body)
    if (!validated.success) {
        return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const { tagId, storagePath, title, mimeType, sizeBytes, durationMs } = validated.data

    // Verify ownership
    // @ts-ignore
    const { data: tag } = await supabase.from('tags').select('*').eq('id', tagId).single() as any
    if (!tag || tag.owner_user_id !== user.id) {
        return NextResponse.json({ error: 'Tag not found or unauthorized' }, { status: 403 })
    }

    // Verify file exists in storage? 
    // Probably good to check if metadata matches or just trust client for MVP + ownership check.
    // We can't easily check 'exists' without listing or getMetadata, which is extra call.
    // We'll trust client provided 'storagePath' matches what they uploaded to.
    // The 'storagePath' must start with tags/{tagId}/ as per our RLS/Logic.
    if (!storagePath.startsWith(`tags/${tagId}/`)) {
        return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 })
    }

    // Insert into audios
    // @ts-ignore
    const { error } = await supabase.from('audios').insert({
        tag_id: tagId,
        storage_path: storagePath,
        title: title,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        duration_ms: durationMs || 0 // Frontend might calculate this or we default 0
    })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
