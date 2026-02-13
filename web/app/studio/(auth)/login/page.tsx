import { loginAction } from './actions'
import { LogIn } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  empty: 'パスワードを入力してください',
  invalid: '無効なパスワードです',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { error } = await searchParams
  const errorMessage = typeof error === 'string' ? ERROR_MESSAGES[error] : null

  return (
    <div className="studio-shell s-noise flex items-center justify-center min-h-screen px-4">
      <div className="relative z-10 w-full max-w-sm s-animate-in">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--s-surface)] border border-[var(--s-border)] mb-5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--s-accent)]">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">NFC Studio</h1>
          <p className="text-sm text-[var(--s-text-muted)] mt-1.5">
            配布されたパスワードでログイン
          </p>
        </div>

        {/* Form */}
        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-[var(--s-text-muted)] mb-2 ml-0.5">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="パスワードを入力"
              className="s-input w-full"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-[var(--s-danger)] text-center font-medium">{errorMessage}</p>
          )}

          <button type="submit" className="s-btn s-btn-primary w-full py-2.5 text-sm">
            <LogIn className="w-4 h-4" />
            ログイン
          </button>
        </form>
      </div>
    </div>
  )
}
