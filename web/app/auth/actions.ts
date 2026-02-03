'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Login Error:', error.message)
        return { error: error.message }
    }

    revalidatePath('/studio', 'layout')
    redirect('/studio/tags')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // 1. Try standard signup first
    const { error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        console.error('Signup Error:', error.message)

        // DEVELOPMENT ONLY FALLBACK:
        // If we hit a rate limit or email issue in dev, try to force create the user via Admin API
        // effectively bypassing email confirmation and rate limits.
        if (process.env.NODE_ENV === 'development') {
            const { createServiceRoleClient } = await import('@/lib/supabase/server')
            const adminSupabase = await createServiceRoleClient()

            console.log('Attempting Admin User Creation (Dev Mode)...')
            const { data: adminUser, error: adminError } = await adminSupabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true // Auto confirm
            })

            if (adminError) {
                console.error('Admin Creation failed:', adminError.message)
                return { error: error.message } // Return original error if admin fails too
            }

            // User created via Admin. Now login normally to set the session cookie.
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (loginError) {
                console.error('Login after Admin Creation failed:', loginError.message)
                return { error: loginError.message }
            }

            // Success via Admin fallback
            revalidatePath('/studio', 'layout')
            redirect('/studio/tags')
        }

        return { error: error.message }
    }

    // Standard flow success (rare in dev if email confirm is ON without SMTP)
    revalidatePath('/studio', 'layout')
    redirect('/studio/tags')
}
