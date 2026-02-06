import { NextRequest, NextResponse } from 'next/server'
import { verifySdm } from '@/lib/sdm/verify'
import { createClient } from '@/lib/supabase/server'
import { SignJWT } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const tid = searchParams.get('tid')
    const e = searchParams.get('e')
    const c = searchParams.get('c')

    // DEV BYPASS
    if (req.nextUrl.pathname.startsWith('/dev/tap')) {
        // Allow fallback
    }

    if (!tid || !e || !c) {
        // Check for DEV_TAP logic
        // Prompt: /dev/tap?tid=... (ignores e/c)
        // But this route is /api/tap?
        // Actual implementation of bypass could be check e=='dev'
        return NextResponse.redirect(new URL('/error?msg=missing_params', req.url))
    }

    // 1. Verify SDM
    const { isValid, uid, ctr } = verifySdm(e, c, tid)

    if (!isValid) {
        return NextResponse.redirect(new URL('/error?msg=invalid_tag', req.url))
    }

    const supabase = await createClient()

    // 2. Fetch Tag & Check Replay
    // We need service role for checking tap_events/tags securely if RLS blocks logic?
    // Actually, 'tags' is readable by owners. Service usage needed for robust backend checks.
    // EXCEPT: We use 'supabase' from 'createClient' which is cookie-based (server client).
    // BUT the user tapping is ANONYMOUS. They have no auth cookie.
    // So 'supabase' here is Anon client.
    // Anon cannot read 'tags' (RLS: owners only).
    // WE NEED SERVICE ROLE here.

    // Use generic supabase-js with service key
    const { createClient: createServiceClient } = require('@supabase/supabase-js')
    const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: tag } = await serviceClient
        .from('tags')
        .select('*')
        .eq('id', tid)
        .single()

    if (!tag) {
        return NextResponse.redirect(new URL('/error?msg=tag_not_found', req.url))
    }

    // 3. Replay Protection
    if (tag.last_ctr && ctr! <= tag.last_ctr) {
        // Check time window?
        // For MVP, strict check: current ctr must be > last_ctr
        // Exception: duplicate tap (same ctr) within 10s?
        // We'll skip complex time window for now, Strict < check.
        if (ctr !== tag.last_ctr) { // strictly less
            return NextResponse.redirect(new URL('/error?msg=replay_detected', req.url))
        } else {
            // Equal: check time
            const lastAt = new Date(tag.last_ctr_at).getTime()
            const now = Date.now()
            if (now - lastAt > 600000) { // 10 minutes cache window
                return NextResponse.redirect(new URL('/error?msg=replay_timeout', req.url))
            }
        }
    }

    // 4. Update Tag (Last CTR) & Log
    await serviceClient.from('tags').update({
        last_ctr: ctr,
        last_ctr_at: new Date().toISOString(),
        uid_hex: uid // Bind UID if first time
    }).eq('id', tid)

    await serviceClient.from('tap_events').insert({
        tag_id: tid,
        uid_hex: uid,
        ctr: ctr,
        // ip hash if possible
    })

    // 5. Issue Session Cookie (JWT)
    const token = await new SignJWT({ tagId: tid, uid })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('10m') // 10 min session
        .sign(SECRET)

    const res = NextResponse.redirect(new URL(`/a/${tag.slug}`, req.url))
    res.cookies.set('nfc_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10 // 10 mins
    })

    return res
}
