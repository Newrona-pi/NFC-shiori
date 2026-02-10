'use server'

import { redirect } from 'next/navigation'
import { passwordToSlug, passwordToHash } from '@/lib/auth/hash'
import { createStudioSession, destroyStudioSession } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function loginAction(formData: FormData): Promise<void> {
  const password = formData.get('password') as string
  if (!password || password.length < 1) {
    redirect('/studio/login?error=empty')
  }

  const slug = await passwordToSlug(password)
  const fullHash = await passwordToHash(password)

  const supabase = createServiceClient()

  // Check if channel exists
  const { data: existing } = await supabase
    .from('tags')
    .select('id, password_hash')
    .eq('slug', slug)
    .single()

  if (existing) {
    // Verify full hash (collision prevention)
    if (existing.password_hash !== fullHash) {
      redirect('/studio/login?error=mismatch')
    }
  } else {
    // Create new channel
    const { error } = await supabase.from('tags').insert({
      slug,
      password_hash: fullHash,
      display_name: 'マイチャンネル',
    })
    if (error) {
      console.error('Create channel error:', error)
      redirect('/studio/login?error=create_failed')
    }
  }

  await createStudioSession(slug)
  redirect('/studio')
}

export async function logoutAction(): Promise<void> {
  await destroyStudioSession()
  redirect('/studio/login')
}
