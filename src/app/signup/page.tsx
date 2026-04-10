import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Bot, Sparkles } from 'lucide-react';
import { GoogleButton } from '@/components/Auth/GoogleButton';

async function signup(formData: FormData) {
  'use server';

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (password !== confirmPassword) {
    return redirect('/signup?error=Passwords do not match');
  }

  if (password.length < 6) {
    return redirect('/signup?error=Password must be at least 6 characters');
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return redirect(`/signup?error=${error.message}`);
  }

  return redirect('/discovery/new');
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/10 text-primary-500 mb-4">
            <Sparkles size={32} />
          </div>
          <h1 className="text-3xl font-bold font-heading text-white mb-2">SmartSlate Polaris</h1>
          <p className="text-sm text-white/40">Agentic Discovery Workspace v4.0</p>
        </div>

        {/* Signup Card */}
        <div className="glass-card rounded-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-sm text-white/40">Start your discovery journey today</p>
          </div>

          {params.error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400 text-center">{params.error}</p>
            </div>
          )}

          {/* Google OAuth */}
          <GoogleButton />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-transparent text-white/30 font-medium">or sign up with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form action={signup} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 rounded-xl bg-primary-500 text-brand-bg font-semibold hover:bg-primary-400 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-brand-bg transition-all"
            >
              Create Account
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/40">
              Already have an account?{' '}
              <a href="/login" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
                Sign in
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-white/20 flex items-center justify-center gap-2">
            <Bot size={14} />
            Powered by Polaris AI Protocol
          </p>
        </div>
      </div>
    </div>
  );
}
