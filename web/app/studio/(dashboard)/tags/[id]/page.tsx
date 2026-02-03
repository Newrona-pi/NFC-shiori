import { createClient } from '@/lib/supabase/server'
import { FileUploader } from './file-uploader'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Play, Clock, Calendar } from 'lucide-react'

export default async function TagDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/studio/login')

    const { data: tag, error } = await supabase
        .from('tags')
        .select('*')
        .eq('id', id)
        .single() as any

    if (error || !tag) notFound()

    // Ensure ownership (RLS handles fetch, but double check redirects to 404/home if empty)
    if (tag.owner_user_id !== user.id) {
        return notFound()
    }

    const { data: audios } = await supabase
        .from('audios')
        .select('*')
        .eq('tag_id', id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8">
            <div>
                <Link href="/studio/tags" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back to Tags
                </Link>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">{tag.display_name}</h1>
                <p className="text-slate-500 font-mono text-sm">Tag ID: {tag.id}</p>
                <p className="text-slate-500 font-mono text-sm">URL Slug: /{tag.slug}</p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <FileUploader tagId={tag.id} />

                    <div className="mt-8 rounded-md bg-slate-100 p-4 text-xs font-mono text-slate-600 break-all">
                        <p className="font-bold mb-2">NFCTag NDEF URL:</p>
                        {process.env.APP_BASE_URL}/tap?tid={tag.id}&e=00000000000000000000000000000000&c=0000000000000000
                        <p className="mt-2 text-slate-400">(Replace e/c with NTAG placeholder)</p>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-medium text-slate-900">Audio History</h3>
                    <div className="overflow-hidden bg-white shadow sm:rounded-md">
                        <ul role="list" className="divide-y divide-slate-200">
                            {audios?.map((audio: any) => (
                                <li key={audio.id}>
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <p className="truncate text-sm font-medium text-indigo-600">{audio.title}</p>
                                            <div className="ml-2 flex flex-shrink-0">
                                                {tag.latest_audio_id === audio.id && (
                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-slate-500">
                                                    <Clock className="mr-1.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                                                    {Math.round((audio.duration_ms || 0) / 1000)}s
                                                </p>
                                                <p className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0 sm:ml-6">
                                                    File size: {(audio.size_bytes || 0) / 1024 / 1024 < 1
                                                        ? `${Math.round((audio.size_bytes || 0) / 1024)} KB`
                                                        : `${((audio.size_bytes || 0) / 1024 / 1024).toFixed(1)} MB`
                                                    }
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0">
                                                <Calendar className="mr-1.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                                                <p>
                                                    Updated on {new Date(audio.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {!audios?.length && (
                                <li className="px-4 py-8 text-center text-sm text-slate-500">No audio uploaded yet.</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
