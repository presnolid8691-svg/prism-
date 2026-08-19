import { LoginForm } from '@/components/auth/LoginForm'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
      <h1 className="text-4xl font-bold text-blue-600 mb-8 tracking-tight">Prism</h1>
      <LoginForm />
      <div className="mt-6 w-full max-w-md flex flex-col items-center">
        <div className="w-full flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-sm text-zinc-500">or</span>
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <GoogleSignInButton />
      </div>
    </div>
  )
}