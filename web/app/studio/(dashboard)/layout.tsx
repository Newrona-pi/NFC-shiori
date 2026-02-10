import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getStudioSession } from '@/lib/auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { logoutAction } from '@/app/studio/(auth)/login/actions'
import { Sparkles, LogOut } from 'lucide-react'

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
    <div className="min-h-screen text-white relative font-mplus">
      {/* Kawaii Floating Navbar */}
      <nav className="fixed top-4 left-4 right-4 z-50">
        <div className="mx-auto max-w-7xl">
          <div className="kawaii-card px-6 py-3 flex items-center justify-between shadow-lg backdrop-blur-xl bg-white/10 border border-white/20 rounded-full">
            {/* Logo Area */}
            <Link href="/studio" className="group flex items-center space-x-2 text-xl font-bold text-white hover:text-pink-200 transition-colors">
              <div className="bg-gradient-to-tr from-pink-400 to-purple-500 p-2 rounded-full shadow-md group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-mplus tracking-tight hidden sm:block">NFC Studio</span>
            </Link>

            {/* User Profile / Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 bg-black/20 rounded-full border border-white/5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[10px] font-bold">
                  {displayName[0]?.toUpperCase()}
                </div>
                <span className="text-xs text-white/70 max-w-[120px] truncate hidden sm:block">
                  {displayName}
                </span>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="p-2 rounded-full bg-white/5 hover:bg-pink-500/80 text-white/70 hover:text-white transition-all duration-300 hover:rotate-12"
                  title="ログアウト"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with top padding for fixed nav */}
      <main className="pt-28 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  )
}
