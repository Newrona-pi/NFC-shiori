import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const InitSchema = z.object({
    tagId: z.string().uuid(),
    filename: z.string().min(1),
    mimeType: z.string().startsWith('audio/')
})

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = InitSchema.safeParse(body)
    if (!validated.success) {
        return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const { tagId, filename, mimeType } = validated.data

    // Verify ownership
    // @ts-ignore
    const { data: tag } = await supabase.from('tags').select('*').eq('id', tagId).single() as any
    if (!tag || tag.owner_user_id !== user.id) {
        return NextResponse.json({ error: 'Tag not found or unauthorized' }, { status: 403 })
    }

    // Generate storage path: tags/{tagId}/{random_id}_{filename}
    const fileId = crypto.randomUUID()
    const path = `tags/${tagId}/${fileId}_${filename}`

    // Create Signed Upload URL
    const { data, error } = await supabase.storage
        .from('audios')
        .createSignedUploadUrl(path)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
        signedUrl: data.signedUrl,
        path: data.path, // We need the path to commit later
        token: data.token // In case needed (createSignedUploadUrl returns signedUrl which includes token usually)
    })
}
