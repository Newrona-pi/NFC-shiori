import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Sparkles, Tag, Settings, LogOut } from 'lucide-react'

// Simple SignOut action for now
import { signout } from '@/app/auth/actions'

export default async function StudioLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/studio/login')
    }

    return (
        <div className="min-h-screen text-white relative font-mplus">
            {/* Background is handled in globals.css (Kawaii Gradient) */}

            {/* Kawaii Floating Navbar */}
            <nav className="fixed top-4 left-4 right-4 z-50">
                <div className="mx-auto max-w-7xl">
                    <div className="kawaii-card px-6 py-3 flex items-center justify-between shadow-lg backdrop-blur-xl bg-white/10 border border-white/20 rounded-full">

                        {/* Logo Area */}
                        <div className="flex items-center space-x-8">
                            <Link href="/studio/tags" className="group flex items-center space-x-2 text-xl font-bold text-white hover:text-pink-200 transition-colors">
                                <div className="bg-gradient-to-tr from-pink-400 to-purple-500 p-2 rounded-full shadow-md group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-mplus tracking-tight hidden sm:block">NFC Studio</span>
                            </Link>

                            {/* Nav Links */}
                            <div className="hidden md:flex space-x-4">
                                <Link
                                    href="/studio/tags"
                                    className="px-4 py-2 rounded-full text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white transition-all hover:scale-105 flex items-center"
                                >
                                    <Tag className="w-4 h-4 mr-2" />
                                    Tags
                                </Link>
                                <Link
                                    href="/studio/settings" // Future
                                    className="px-4 py-2 rounded-full text-sm font-bold text-white/50 hover:bg-white/5 hover:text-white transition-all flex items-center"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </Link>
                            </div>
                        </div>

                        {/* User Profile / Logout */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 px-3 py-1 bg-black/20 rounded-full border border-white/5">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[10px] font-bold">
                                    {user.email?.[0].toUpperCase()}
                                </div>
                                <span className="text-xs text-white/70 max-w-[100px] truncate hidden sm:block">
                                    {user.email}
                                </span>
                            </div>

                            <form action={signout}>
                                <button
                                    type="submit"
                                    className="p-2 rounded-full bg-white/5 hover:bg-pink-500/80 text-white/70 hover:text-white transition-all duration-300 hover:rotate-12"
                                    title="Sign Out"
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
                {/* Content Wrapper with Fade In */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </div>
            </main>
        </div>
    )
}
