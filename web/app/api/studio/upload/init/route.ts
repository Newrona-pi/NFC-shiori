import { getStudioSession } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const InitSchema = z.object({
  tagId: z.string().uuid(),
  filename: z.string().min(1),
  mimeType: z.string().startsWith('audio/'),
})

export async function POST(req: Request) {
  const session = await getStudioSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const validated = InitSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const { tagId, filename, mimeType } = validated.data
  const supabase = createServiceClient()

  // Verify ownership via slug
  const { data: tag } = await supabase.from('tags').select('id, slug').eq('id', tagId).single()
  if (!tag || tag.slug !== session.slug) {
    return NextResponse.json({ error: 'Tag not found or unauthorized' }, { status: 403 })
  }

  // Generate storage path
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
    path: data.path,
    token: data.token,
  })
}
