import { getStudioSession } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CommitSchema = z.object({
  tagId: z.string().uuid(),
  storagePath: z.string().min(1),
  title: z.string().min(1),
  mimeType: z.string(),
  sizeBytes: z.number(),
  durationMs: z.number().optional(),
})

export async function POST(req: Request) {
  const session = await getStudioSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const validated = CommitSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const { tagId, storagePath, title, mimeType, sizeBytes, durationMs } = validated.data
  const supabase = createServiceClient()

  // Verify ownership via slug
  const { data: tag } = await supabase.from('tags').select('id, slug').eq('id', tagId).single()
  if (!tag || tag.slug !== session.slug) {
    return NextResponse.json({ error: 'Tag not found or unauthorized' }, { status: 403 })
  }

  if (!storagePath.startsWith(`tags/${tagId}/`)) {
    return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 })
  }

  const { error } = await supabase.from('audios').insert({
    tag_id: tagId,
    storage_path: storagePath,
    title,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    duration_ms: durationMs || 0,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
