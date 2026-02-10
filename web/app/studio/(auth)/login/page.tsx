import { loginAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  empty: 'パスワードを入力してください',
  mismatch: 'パスワードが一致しません',
  create_failed: 'チャンネルの作成に失敗しました',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { error } = await searchParams
  const errorMessage = typeof error === 'string' ? ERROR_MESSAGES[error] : null

  return (
    <div className="flex min-h-screen items-center justify-center font-mplus">
      <div className="w-full max-w-md space-y-8 kawaii-card p-8 bg-white/70 backdrop-blur-xl">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-pink-400 to-purple-500 rounded-full shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#5d5d8d]">NFC Studio</h1>
          <p className="text-sm text-slate-500">
            パスワードを入力してログイン・新規作成
          </p>
        </div>

        <form action={loginAction} className="mt-8 space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-bold text-slate-500 ml-1 mb-2">
              パスワード
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="パスワードを入力..."
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-700 placeholder-slate-300 focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-500 font-bold text-center">{errorMessage}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-300 to-purple-300 text-white font-bold py-3.5 px-8 rounded-full shadow-lg hover:shadow-pink-200 hover:scale-105 active:scale-95 transition-all duration-300 kawaii-btn"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            ログイン / 新規作成
          </Button>
        </form>
      </div>
    </div>
  )
}
