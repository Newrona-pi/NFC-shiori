import { login, signup } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sign in to your account</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Or create a new account to get started
                    </p>
                </div>

                <form className="mt-8 space-y-6">
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="Email address"
                                className="rounded-b-none"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                placeholder="Password"
                                className="rounded-t-none"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Button formAction={login as any} className="w-full">
                            Sign in
                        </Button>
                        <Button formAction={signup as any} variant="outline" className="w-full">
                            Sign up
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
