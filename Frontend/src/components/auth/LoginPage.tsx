import React, { FormEvent, useState } from 'react';
import { ArrowRight, LoaderCircle, LockKeyhole, UserCircle, X, ShieldCheck, Sparkles, MoveHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { IsometricAuthHero } from './IsometricAuthHero';

interface LoginPageProps {
  onCancel?: () => void;
  onAuthenticated?: () => void;
  title?: string;
  expectedRole?: UserRole;
  isometricSide?: 'left' | 'right';
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
  isometricSide = 'left',
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [side, setSide] = useState<'left' | 'right'>(isometricSide);
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
    <main
      className={`relative min-h-screen flex items-center justify-center overflow-y-auto bg-slate-950 px-4 py-8 sm:py-12 text-slate-100 ${
        onCancel ? 'fixed inset-0 z-[60]' : ''
      }`}
    >
      {/* Ambient Radial Lights */}
      <div className="pointer-events-none fixed -left-24 top-0 h-96 w-96 rounded-full bg-indigo-600/15 blur-[140px]" />
      <div className="pointer-events-none fixed -right-24 bottom-0 h-96 w-96 rounded-full bg-cyan-500/15 blur-[140px]" />

      {/* Top Header Actions (Position Toggle & Close) */}
      <div className="absolute top-4 inset-x-4 sm:inset-x-8 flex items-center justify-between z-20 pointer-events-auto">
        {/* 3D Isometric Animation Side Switcher */}
        <button
          type="button"
          onClick={() => setSide(side === 'left' ? 'right' : 'left')}
          className="group hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 hover:border-indigo-400 text-xs font-mono text-slate-300 backdrop-blur-md transition shadow-md"
          title="Toggle 3D Isometric Animation Left or Right Side"
        >
          <MoveHorizontal className="h-3.5 w-3.5 text-indigo-400 group-hover:rotate-180 transition-transform duration-300" />
          <span>3D Animation: <strong className="text-white uppercase">{side}</strong> (Click to Flip)</span>
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="ml-auto rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white border border-slate-800 bg-slate-900/60"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ── 2-Column Responsive Layout ──────────────────────────────────── */}
      <div className="relative w-full max-w-6xl mx-auto my-auto pt-6 sm:pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: 3D Isometric Hero or Auth Form depending on side */}
          <div
            className={`lg:col-span-6 xl:col-span-7 flex justify-center ${
              side === 'right' ? 'lg:order-2' : 'lg:order-1'
            }`}
          >
            <IsometricAuthHero />
          </div>

          {/* Right Column: Authentication Card depending on side */}
          <div
            className={`lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto ${
              side === 'right' ? 'lg:order-1' : 'lg:order-2'
            }`}
          >
            <div className="mb-6 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-medium mb-3">
                <Sparkles className="h-3 w-3" />
                <span>Enterprise Identity Gateway</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {mode === 'register'
                  ? 'Create your account'
                  : title || (expectedRole ? roleTitles[expectedRole] : 'Welcome back')}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                {mode === 'register'
                  ? 'Register for customer self-service access.'
                  : expectedRole
                  ? `Sign in with your ${expectedRole} account to open the ${expectedRole} portal.`
                  : 'Sign in to access your autonomous subscription workspace.'}
              </p>
            </div>

            <section className="relative rounded-3xl border border-indigo-500/30 bg-slate-900/85 p-6 sm:p-8 shadow-2xl shadow-indigo-950/70 backdrop-blur-2xl overflow-hidden">
              {/* 3D Top Specular Highlight */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/60 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 shrink-0">
                  {mode === 'register' ? (
                    <UserCircle className="h-5 w-5" />
                  ) : (
                    <LockKeyhole className="h-5 w-5" />
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
                      : 'Your role routes automatically to Admin, Staff, or Customer portal.'}
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
                        className="w-full rounded-xl border border-slate-700/90 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
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
                        className="w-full rounded-xl border border-slate-700/90 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
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
                    className="w-full rounded-xl border border-slate-700/90 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
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
                    className="w-full rounded-xl border border-slate-700/90 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                    placeholder={mode === 'register' ? 'Create a password' : 'Enter your password'}
                  />
                </label>

                {mode === 'register' && (
                  <p className="text-xs leading-relaxed text-slate-400">
                    At least 9 characters with uppercase, lowercase, and a special character.
                  </p>
                )}

                {error && (
                  <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-indigo-600/30 active:scale-98"
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
                    className="font-semibold text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
                  >
                    {mode === 'register' ? 'Sign in' : 'Create an account'}
                  </button>
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};
