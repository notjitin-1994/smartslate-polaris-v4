import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, Sparkles, Clock, ArrowRight } from 'lucide-react';
import SwirlBackground from '@/components/SwirlBackground';
import { LoginMarketingSection } from '@/components/Auth/LoginMarketingSection';
import { GoogleButton } from '@/components/Auth/GoogleButton';
import { AuthHeader } from '@/components/Auth/AuthHeader';

async function login(formData: FormData) {
  'use server';

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect('/login?error=Invalid credentials');
  }

  return redirect('/discovery/new');
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#020C1B] px-4 py-4 font-sans">
      {/* Animated background */}
      <SwirlBackground />

      {/* Modern Gradient Overlays */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-primary-500/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[5%] h-[30%] w-[30%] rounded-full bg-secondary-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1100px] flex items-center justify-center">
        {/* DESKTOP VIEW */}
        <div className="hidden xl:grid grid-cols-[1fr_0.8fr] gap-0 bg-white/[0.02] border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-3xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] w-full max-h-[85vh]">
          {/* Left: Marketing */}
          <aside className="relative flex flex-col p-10 lg:p-12 overflow-y-auto scrollbar-none border-r border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
            <LoginMarketingSection />
          </aside>

          {/* Right: Login Form */}
          <main className="flex flex-col justify-center p-10 lg:p-12 overflow-y-auto scrollbar-none bg-black/20">
            <div className="w-full max-w-[320px] mx-auto space-y-6">
              <AuthHeader 
                title="Welcome Back" 
                subtitle="Continue your journey." 
              />

              {params.error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-2 duration-500">
                  <p className="text-[12px] text-red-400 font-medium text-center">{params.error}</p>
                </div>
              )}

              <LoginForm action={login} />

              <div className="pt-6 border-t border-white/5">
                <p className="text-[12px] text-white/30 font-light">
                  New to Polaris?{' '}
                  <Link
                    href="/signup"
                    className="text-primary-500 hover:text-primary-400 font-semibold underline underline-offset-4 decoration-primary-500/30 hover:decoration-primary-500 transition-all duration-300"
                  >
                    Create workspace
                  </Link>
                </p>
              </div>
            </div>
          </main>
        </div>

        {/* MOBILE & TABLET VIEW */}
        <div className="xl:hidden w-full max-w-sm mx-auto space-y-6 flex flex-col items-center justify-center max-h-[95vh] overflow-y-auto scrollbar-none py-4">
          {/* Mobile Marketing Card - Simplified */}
          <section className="w-full p-6 rounded-[1.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-2xl flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded-md bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
                <Sparkles size={14} className="text-primary-500" />
              </div>
              <h2 className="font-heading text-sm font-bold text-white tracking-tight">Polaris v4</h2>
            </div>
            
            <h1 className="font-heading text-xl font-bold text-white leading-tight mb-2">
              Design <span className="text-primary-500 italic">experiences.</span>
            </h1>
            
            <div className="grid grid-cols-3 gap-2">
              <MetricCard value="15x" label="Faster" icon={<Clock className="h-3 w-3" />} />
              <MetricCard value="98%" label="AI" icon={<Sparkles className="h-3 w-3" />} />
              <MetricCard value="Free" label="Start" icon={<Shield className="h-3 w-3" />} />
            </div>
          </section>

          {/* Mobile Login Card */}
          <div className="w-full p-6 rounded-[2rem] bg-black/40 border border-white/10 backdrop-blur-3xl shadow-2xl space-y-6 flex-shrink-0">
            <AuthHeader 
              title="Sign In" 
              subtitle="Access your blueprints." 
            />

            {params.error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-[12px] text-red-400 font-medium text-center">{params.error}</p>
              </div>
            )}

            <LoginForm action={login} />

            <div className="pt-4 border-t border-white/5 text-center">
              <p className="text-[12px] text-white/30 font-light">
                No account?{' '}
                <Link
                  href="/signup"
                  className="text-primary-500 hover:text-primary-400 font-semibold transition-colors duration-300"
                >
                  Join now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <div className="space-y-6">
      <GoogleButton />

      <div className="relative py-1 flex items-center">
        <div className="flex-grow h-px bg-white/5" />
        <span className="flex-shrink-0 px-3 text-[9px] font-bold text-white/10 uppercase tracking-[0.2em]">
          or use email
        </span>
        <div className="flex-grow h-px bg-white/5" />
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-1.5 group">
          <label className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] ml-1 group-focus-within:text-primary-500 transition-colors">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="name@organization.com"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder-white/10 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all font-sans font-light"
          />
        </div>
        <div className="space-y-1.5 group">
          <div className="flex justify-between items-center px-1">
            <label className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] group-focus-within:text-primary-500 transition-colors">
              Password
            </label>
            <Link href="#" className="text-[9px] font-bold text-primary-500/30 uppercase tracking-widest hover:text-primary-500 transition-colors">
              Forgot?
            </Link>
          </div>
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder-white/10 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all font-sans font-light"
          />
        </div>
        <button
          type="submit"
          className="group relative w-full overflow-hidden rounded-xl bg-primary-500 px-6 py-3.5 text-xs font-bold text-[#020C1B] transition-all hover:bg-primary-400 hover:shadow-[0_0_20px_rgba(167,218,219,0.2)] focus:ring-2 focus:ring-primary-500/50 active:scale-[0.98]"
        >
          <span className="relative flex items-center justify-center gap-2">
            Sign In to Polaris
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </button>
      </form>
    </div>
  );
}

function MetricCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center backdrop-blur-md">
      <div className="text-primary-500/50 mb-1 flex justify-center">{icon}</div>
      <div className="text-base font-bold text-white tracking-tight leading-none mb-0.5">{value}</div>
      <div className="text-[8px] font-bold text-white/10 uppercase tracking-[0.1em]">{label}</div>
    </div>
  );
}
