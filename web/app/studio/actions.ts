'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CreateTagSchema = z.object({
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric"),
    displayName: z.string().min(1)
})

export async function createTag(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/studio/login')
    }

    const rawData = {
        slug: formData.get('slug'),
        displayName: formData.get('display_name')
    }

    const validated = CreateTagSchema.safeParse(rawData)
    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    // @ts-ignore
    const { error } = await (supabase.from('tags') as any)
        .insert({
            owner_user_id: user.id,
            slug: validated.data.slug,
            display_name: validated.data.displayName
        })

    if (error) {
        console.error('Create Tag DB Error:', error)
        // Handle unique constraint on slug
        if (error.code === '23505') {
            return { error: { slug: ['Slug already exists'] } }
        }
        return { error: { form: [error.message] } }
    }

    revalidatePath('/studio/tags')
    return { success: true }
}
