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
