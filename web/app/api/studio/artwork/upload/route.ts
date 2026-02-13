import { getStudioSession } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    const session = await getStudioSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const tagId = formData.get('tagId') as string | null

    if (!file || !tagId) {
        return NextResponse.json({ error: 'file and tagId are required' }, { status: 400 })
    }

    // Validate image type
    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify ownership via slug
    const { data: tag } = await supabase.from('tags').select('id, slug, artwork_path').eq('id', tagId).single()
    if (!tag || tag.slug !== session.slug) {
        return NextResponse.json({ error: 'Tag not found or unauthorized' }, { status: 403 })
    }

    // Delete old artwork if exists
    if (tag.artwork_path) {
        await supabase.storage.from('artworks').remove([tag.artwork_path])
    }

    // Upload new artwork
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${tagId}/${crypto.randomUUID()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
        .from('artworks')
        .upload(path, buffer, {
            contentType: file.type,
            upsert: false,
        })

    if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Update tags table with artwork path
    const { error: updateError } = await supabase
        .from('tags')
        .update({ artwork_path: path })
        .eq('id', tagId)

    if (updateError) {
        // Clean up uploaded file
        await supabase.storage.from('artworks').remove([path])
        return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Return signed URL for preview
    const { data: signedData } = await supabase.storage
        .from('artworks')
        .createSignedUrl(path, 60 * 60)

    return NextResponse.json({
        success: true,
        artworkUrl: signedData?.signedUrl || null,
    })
}
