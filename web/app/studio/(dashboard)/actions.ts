'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getStudioSession } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function updateDisplayName(formData: FormData): Promise<void> {
  const session = await getStudioSession()
  if (!session) redirect('/studio/login')

  const tagId = formData.get('tagId') as string
  const displayName = formData.get('display_name') as string
  if (!tagId || !displayName) return

  const supabase = createServiceClient()

  // Verify ownership via slug
  const { data: tag } = await supabase
    .from('tags')
    .select('id, slug')
    .eq('id', tagId)
    .single()

  if (!tag || tag.slug !== session.slug) return

  await supabase
    .from('tags')
    .update({ display_name: displayName })
    .eq('id', tagId)

  revalidatePath('/studio')
}

export async function deleteAudio(formData: FormData): Promise<void> {
  const session = await getStudioSession()
  if (!session) redirect('/studio/login')

  const audioId = formData.get('audioId') as string
  if (!audioId) return

  const supabase = createServiceClient()

  // Fetch audio and verify ownership via tag slug
  const { data: audio } = await supabase
    .from('audios')
    .select('id, storage_path, tag_id, tags(slug)')
    .eq('id', audioId)
    .single()

  if (!audio || (audio.tags as any)?.slug !== session.slug) return

  // Delete file from storage
  await supabase.storage.from('audios').remove([audio.storage_path])

  // Delete DB record
  await supabase.from('audios').delete().eq('id', audioId)

  // Update latest_audio_id on the tag
  const { data: latest } = await supabase
    .from('audios')
    .select('id')
    .eq('tag_id', audio.tag_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  await supabase
    .from('tags')
    .update({ latest_audio_id: latest?.id ?? null })
    .eq('id', audio.tag_id)

  revalidatePath('/studio')
}
