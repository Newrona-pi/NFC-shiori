import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getStudioSession } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { logoutAction } from '@/app/studio/(auth)/login/actions'
import { LogOut } from 'lucide-react'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'おとしるべスタジオ',
}

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getStudioSession()
  if (!session) {
    redirect('/studio/login')
  }

  const supabase = createServiceClient()
  const { data: tag } = await supabase
    .from('tags')
    .select('display_name')
    .eq('slug', session.slug)
    .single()

  const displayName = tag?.display_name || session.slug

  return (
    <div className="studio-shell s-noise">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[var(--s-border)] bg-[var(--s-bg)]/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 h-12 flex items-center justify-between">
          {/* Logo */}
          <Link href="/studio" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-[var(--s-accent)] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight text-[var(--s-text)] group-hover:text-[var(--s-accent)] transition-colors">
              おとしるべスタジオ
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--s-text-muted)] max-w-[140px] truncate hidden sm:block">
              {displayName}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="s-btn s-btn-ghost py-1.5 px-3 text-xs"
                title="ログアウト"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-5">
        <div className="s-animate-in">
          {children}
        </div>
      </main>
    </div>
  )
}
