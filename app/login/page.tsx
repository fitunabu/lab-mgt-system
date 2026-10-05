'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { registerTeacher } from '@/lib/actions';
import lmsLogo from '../LMS-01.png';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Password123!');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Unable to sign in right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await registerTeacher(new FormData(event.currentTarget));
      setEmail(typeof result?.email === 'string' ? result.email : '');
      setPassword('');
      setMode('login');
      setSuccess('Your teacher account has been created. Sign in with your email and password.');
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <Image src={lmsLogo} alt="LMS logo" priority className="mx-auto mb-4 h-20 w-20 object-contain" />
          <h1 className="text-2xl font-semibold text-slate-900">Computer Lab Portal</h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === 'login' ? 'Sign in to manage laboratory requests and inspections' : 'Create a teacher account'}
          </p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                id="login-email"
                type="email"
                value={email ?? ''}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-0 focus:border-blue-500"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={passwordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11 outline-none ring-0 focus:border-blue-500"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-slate-500 hover:text-slate-800"
                  aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  aria-pressed={passwordVisible}
                >
                  {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            {success && <p role="status" className="text-sm text-emerald-700">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
            <p className="text-center text-sm text-slate-600">
              New teacher?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                  setSuccess('');
                }}
                className="font-medium text-blue-700 hover:underline"
              >
                Create an account
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
              <input id="signup-name" name="name" type="text" autoComplete="name" minLength={2} required className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label htmlFor="signup-department" className="mb-1 block text-sm font-medium text-slate-700">Department</label>
              <input id="signup-department" name="department" type="text" required className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label htmlFor="signup-phone" className="mb-1 block text-sm font-medium text-slate-700">Phone number</label>
              <input id="signup-phone" name="phone" type="tel" autoComplete="tel" required className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input id="signup-email" name="email" type="email" autoComplete="email" required className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={8} required className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
              <p className="mt-1 text-xs text-slate-500">Password must be at least 8 characters.</p>
            </div>

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loading ? 'Creating account...' : 'Create teacher account'}
            </button>
            <p className="text-center text-sm text-slate-600">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccess('');
                }}
                className="font-medium text-blue-700 hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
