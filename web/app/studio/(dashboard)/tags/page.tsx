import { createClient } from '@/lib/supabase/server'
import { createTag } from '@/app/studio/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function TagsPage() {
    const supabase = await createClient()
    const { data: tags } = await supabase.from('tags').select('*').order('created_at', { ascending: false })

    return (
        <div className="space-y-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Interactive Tags
                    </h2>
                </div>
            </div>

            <div className="rounded-md bg-white p-6 shadow">
                <h3 className="text-lg font-medium leading-6 text-slate-900 mb-4">Create New Tag</h3>
                <form action={createTag as any} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label htmlFor="slug" className="block text-sm font-medium text-slate-700">Slug (URL ID)</label>
                        <Input name="slug" id="slug" placeholder="e.g. my-event-2024" required pattern="[a-z0-9\-]+" />
                        <p className="mt-1 text-xs text-slate-500">Only lowercase letters, numbers, and hyphens.</p>
                    </div>
                    <div className="flex-1">
                        <label htmlFor="display_name" className="block text-sm font-medium text-slate-700">Display Name</label>
                        <Input name="display_name" id="display_name" placeholder="e.g. Birthday Party" required />
                    </div>
                    <div className="pb-[2px]">
                        <Button type="submit">
                            <Plus className="mr-2 h-4 w-4" /> Create
                        </Button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tags?.map((tag: any) => (
                    <Link key={tag.id} href={`/studio/tags/${tag.id}`} className="block group">
                        <div className="flex flex-col h-full overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-md border border-transparent hover:border-indigo-500">
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">
                                        {tag.display_name}
                                    </h3>
                                </div>
                                <p className="mt-2 text-sm text-slate-500">/{tag.slug}</p>
                                <div className="mt-4 flex items-center text-xs text-slate-400">
                                    <span>Created {new Date(tag.created_at).toLocaleDateString()}</span>
                                    {tag.latest_audio_id && (
                                        <span className="ml-auto text-green-600 font-medium">Active Audio</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
                {tags?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        No tags created yet.
                    </div>
                )}
            </div>
        </div>
    )
}
