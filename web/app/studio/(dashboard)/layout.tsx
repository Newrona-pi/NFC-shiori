import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

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
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b border-slate-200">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex flex-shrink-0 items-center">
                                <Link href="/studio/tags" className="text-xl font-bold text-indigo-600">
                                    NFC Studio
                                </Link>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link
                                    href="/studio/tags"
                                    className="inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-slate-900"
                                >
                                    Tags
                                </Link>
                            </div>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                            <form action="/auth/signout" method="post">
                                {/* Needs signout action, or just simple button that hits auth/signout */}
                                <span className="text-sm text-slate-500 mr-4">{user.email}</span>
                                {/* Logout button to be implemented properly, simplified for MVP */}
                            </form>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="py-10">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
