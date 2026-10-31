import React, { FormEvent, useState } from 'react';
import { AxiosError } from 'axios';
import { CheckCircle2, LoaderCircle, ShieldCheck, UserPlus } from 'lucide-react';
import { staffApi } from '../../api/staffApi';
import { CreatedStaffAccount } from '../../api/staffApi';
import { UserRole } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { useToast } from '../../context/ToastContext';

type StaffRole = Extract<UserRole, 'admin' | 'staff'>;

const getApiError = (error: unknown) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || axiosError.message || 'Could not create the account.';
};

export const StaffManagement: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<StaffRole>('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdAccount, setCreatedAccount] = useState<CreatedStaffAccount | null>(null);
  const { showToast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setCreatedAccount(null);
    setIsSubmitting(true);

    try {
      const response = await staffApi.create({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });
      if (!response.success || !response.data) {
        setError(response.message || 'Could not create the account.');
        return;
      }

      setCreatedAccount(response.data);
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('staff');
      showToast(`${response.data.role === 'admin' ? 'Administrator' : 'Staff'} account created`);
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-800/60 bg-indigo-950/60 px-3 py-1 text-xs font-semibold text-indigo-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Administrator access
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Add staff account</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create a sign-in account for an administrator or staff member.
        </p>
      </div>

      <BentoCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">Full name</span>
            <input
              type="text"
              name="full_name"
              autoComplete="name"
              required
              maxLength={120}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Staff member's name"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">Role</span>
            <select
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value as StaffRole)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="staff">Staff</option>
              <option value="admin">Administrator</option>
            </select>
            <span className="block text-xs text-slate-500">
              Administrators can manage roles and access sensitive billing settings.
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">Email address</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="name@company.com"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">Temporary password</span>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={9}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Create a strong password"
            />
            <span className="block text-xs text-slate-500">
              At least 9 characters with uppercase, lowercase, and a special character.
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300">
              {error}
            </p>
          )}

          {createdAccount && (
            <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Created {createdAccount.role} account for {createdAccount.full_name} ({createdAccount.email}).
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
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Create account
              </>
            )}
          </button>
        </form>
      </BentoCard>
    </div>
  );
};
