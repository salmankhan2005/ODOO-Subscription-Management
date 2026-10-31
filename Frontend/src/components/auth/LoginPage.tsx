import React, { FormEvent, useState } from 'react';
import { ArrowRight, LoaderCircle, LockKeyhole, UserCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface LoginPageProps {
  onCancel?: () => void;
  onAuthenticated?: () => void;
  title?: string;
  expectedRole?: UserRole;
}

const roleTitles: Record<UserRole, string> = {
  admin: 'Admin sign in',
  staff: 'Staff sign in',
  customer: 'Customer sign in',
};

export const LoginPage: React.FC<LoginPageProps> = ({
  onCancel,
  onAuthenticated,
  title,
  expectedRole,
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result =
      mode === 'register'
        ? await register(fullName, email, password, { company_name: companyName })
        : await login(email, password, expectedRole);

    setIsSubmitting(false);
    if (!result.success) {
      setError(result.message || 'Unable to authenticate. Please try again.');
    } else {
      onAuthenticated?.();
    }
  };

  return (
    <main className={`relative flex min-h-screen items-center justify-center overflow-y-auto bg-[#F7FAFA] px-4 py-12 text-slate-100 ${onCancel ? 'fixed inset-0 z-[60]' : ''}`}>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-5 top-5 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          aria-label="Close add account"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-600/30">
            B
          </div>
          <p className="text-sm font-semibold tracking-wide text-indigo-300">Brightloop Cloud</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
            {mode === 'register'
              ? 'Create your account'
              : title || (expectedRole ? roleTitles[expectedRole] : 'Welcome back')}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === 'register'
              ? 'Register for customer self-service access.'
              : expectedRole
                ? `Sign in with your ${expectedRole} account to open the ${expectedRole} portal.`
                : 'Sign in to continue to your workspace.'}
          </p>
        </div>

        <section className="rounded-2xl border border-slate-700/80 bg-[#FFFFFF]/95 p-6 shadow-2xl sm:p-8">
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/60 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
              {mode === 'register' ? (
                <UserCircle className="h-5 w-5 text-amber-400" />
              ) : (
                <LockKeyhole className="h-5 w-5 text-indigo-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">
              {mode === 'register'
                ? 'Customer registration'
                : expectedRole
                  ? roleTitles[expectedRole]
                  : 'One secure sign-in'}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
              {expectedRole
                ? `Only ${expectedRole} accounts can continue from this sign-in.`
                : 'Your account role opens the appropriate portal automatically.'}
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-slate-300">Full name</span>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Your full name"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-slate-300">
                    Company name <span className="text-slate-500">(optional)</span>
                  </span>
                  <input
                    type="text"
                    name="organization"
                    autoComplete="organization"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Your company"
                  />
                </label>
              </>
            )}

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Email address</span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="you@company.com"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Password</span>
              <input
                type="password"
                name="password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
                minLength={mode === 'register' ? 9 : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder={mode === 'register' ? 'Create a password' : 'Enter your password'}
              />
            </label>

            {mode === 'register' && (
              <p className="text-xs leading-relaxed text-slate-400">
                At least 9 characters with uppercase, lowercase, and a special character.
              </p>
            )}

            {error && (
              <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {mode === 'register' ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  {mode === 'register' ? 'Create customer account' : 'Sign in'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {(expectedRole === undefined || expectedRole === 'customer') && (
            <p className="mt-6 text-center text-sm text-slate-400">
              {mode === 'register' ? 'Already have an account?' : 'New customer?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'register' ? 'login' : 'register');
                  setError('');
                }}
                className="font-semibold text-indigo-300 hover:text-indigo-200"
              >
                {mode === 'register' ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          )}
        </section>
      </div>
    </main>
  );
};
