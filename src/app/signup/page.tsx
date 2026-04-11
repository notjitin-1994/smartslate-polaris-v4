import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, Sparkles, Clock, ArrowRight } from 'lucide-react';
import SwirlBackground from '@/components/SwirlBackground';
import { LoginMarketingSection } from '@/components/Auth/LoginMarketingSection';
import { GoogleButton } from '@/components/Auth/GoogleButton';
import { AuthHeader } from '@/components/Auth/AuthHeader';

async function signup(formData: FormData) {
  'use server';

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.VERCEL_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    return redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  return redirect('/login?message=Check your email to confirm your account');
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-[#020C1B] px-4 py-12 lg:py-20 font-sans">
      {/* Animated background */}
      <SwirlBackground />

      {/* Modern Gradient Overlays */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-primary-500/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[5%] h-[30%] w-[30%] rounded-full bg-secondary-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1200px]">
        {/* DESKTOP VIEW */}
        <div className="hidden xl:grid grid-cols-[1.2fr_1fr] gap-0 bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] min-h-[800px] max-h-[90vh]">
          {/* Left: Marketing */}
          <aside className="relative flex flex-col p-16 overflow-y-auto scrollbar-none border-r border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
            <LoginMarketingSection />
          </aside>

          {/* Right: Signup Form */}
          <main className="flex flex-col justify-center p-16 overflow-y-auto scrollbar-none bg-black/20">
            <div className="w-full max-w-[380px] mx-auto space-y-10">
              <AuthHeader 
                title="Create Workspace" 
                subtitle="Join Polaris and start architecting learning experiences." 
              />

              {params.error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-2 duration-500">
                  <p className="text-sm text-red-400 font-medium text-center">{params.error}</p>
                </div>
              )}

              <SignupForm action={signup} />

              <div className="pt-8 border-t border-white/5">
                <p className="text-sm text-white/40 font-light">
                  Already have a workspace?{' '}
                  <Link
                    href="/login"
                    className="text-primary-500 hover:text-primary-400 font-semibold underline underline-offset-8 decoration-primary-500/30 hover:decoration-primary-500 transition-all duration-300"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </main>
        </div>

        {/* MOBILE & TABLET VIEW */}
        <div className="xl:hidden w-full max-w-md mx-auto space-y-12">
          {/* Mobile Marketing Card */}
          <section className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-8 w-8 rounded-lg bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
                <Sparkles size={18} className="text-primary-500" />
              </div>
              <h2 className="font-heading text-lg font-bold text-white tracking-tight">SmartSlate Polaris</h2>
            </div>
            
            <h1 className="font-heading text-3xl font-bold text-white leading-tight mb-4">
              Design transformational <span className="text-primary-500 italic">learning experiences.</span>
            </h1>
            
            <div className="grid grid-cols-3 gap-3 pt-4">
              <MetricCard value="15x" label="Faster" icon={<Clock className="h-4 w-4" />} />
              <MetricCard value="98%" label="Accuracy" icon={<Sparkles className="h-4 w-4" />} />
              <MetricCard value="Free" label="Start" icon={<Shield className="h-4 w-4" />} />
            </div>
          </section>

          {/* Mobile Signup Card */}
          <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/10 backdrop-blur-3xl shadow-2xl space-y-8">
            <AuthHeader 
              title="Get Started" 
              subtitle="Build your first Strategy Blueprint today." 
            />

            {params.error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400 font-medium text-center">{params.error}</p>
              </div>
            )}

            <SignupForm action={signup} />

            <div className="pt-6 border-t border-white/5 text-center">
              <p className="text-sm text-white/40 font-light">
                Already member?{' '}
                <Link
                  href="/login"
                  className="text-primary-500 hover:text-primary-400 font-semibold transition-colors duration-300"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignupForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <div className="space-y-8">
      <GoogleButton />

      <div className="relative py-2 flex items-center">
        <div className="flex-grow h-px bg-white/5" />
        <span className="flex-shrink-0 px-4 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
          or join with email
        </span>
        <div className="flex-grow h-px bg-white/5" />
      </div>

      <form action={action} className="space-y-6">
        <div className="space-y-2 group">
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] ml-1 group-focus-within:text-primary-500 transition-colors">
            Work Email
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="name@organization.com"
            className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder-white/10 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none transition-all font-sans font-light"
          />
        </div>
        <div className="space-y-2 group">
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] ml-1 group-focus-within:text-primary-500 transition-colors">
            Choose Password
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white placeholder-white/10 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none transition-all font-sans font-light"
          />
          <p className="text-[10px] text-white/20 ml-1 font-light tracking-wide">Must be at least 6 characters</p>
        </div>
        <button
          type="submit"
          className="group relative w-full overflow-hidden rounded-2xl bg-primary-500 px-8 py-4 text-sm font-bold text-[#020C1B] transition-all hover:bg-primary-400 hover:shadow-[0_0_30px_rgba(167,218,219,0.3)] focus:ring-2 focus:ring-primary-500/50 active:scale-[0.98]"
        >
          <span className="relative flex items-center justify-center gap-3">
            Create Free Account
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </span>
        </button>
      </form>
    </div>
  );
}

function MetricCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center backdrop-blur-md hover:border-white/20 transition-colors duration-500">
      <div className="text-primary-500/60 mb-2 flex justify-center">{icon}</div>
      <div className="text-xl font-bold text-white tracking-tight mb-0.5">{value}</div>
      <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.1em]">{label}</div>
    </div>
  );
}
