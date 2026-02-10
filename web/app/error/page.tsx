export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { msg } = await searchParams

  let title = 'エラー'
  let description = 'コンテンツへのアクセス中にエラーが発生しました。'

  if (msg === 'tag_not_found') {
    description = 'リクエストされたチャンネルは存在しません。'
  } else if (msg === 'session_expired') {
    title = 'セッション切れ'
    description = 'セッションが期限切れです。再度ログインしてください。'
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 font-mplus">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold text-[#5d5d8d] mb-4">{title}</h1>
        <p className="text-lg text-slate-500 mb-8">{description}</p>
      </div>
    </div>
  )
}
