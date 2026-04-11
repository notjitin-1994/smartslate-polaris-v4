import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, Sparkles, Clock, ArrowRight, Bot } from 'lucide-react';
import SwirlBackground from '@/components/SwirlBackground';
import { LoginMarketingSection } from '@/components/Auth/LoginMarketingSection';
import { GoogleButton } from '@/components/Auth/GoogleButton';

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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-[#020C1B] px-2 py-8 md:px-6 lg:px-8 lg:py-12">
      {/* Animated background with enhanced depth */}
      <SwirlBackground />

      {/* Subtle ambient glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(167, 218, 219, 0.08), transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* MOBILE VIEW - Outside Desktop Container */}
      <div className="relative z-10 mx-auto w-full max-w-md px-4 xl:hidden">
        {/* MOBILE: Marketing Teaser */}
        <section className="mb-8" aria-label="Quick platform overview">
          <div className="border-primary-500/20 bg-primary-500/10 shadow-primary-500/5 mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 shadow-lg backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="bg-primary-500 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-primary-500 relative inline-flex h-2.5 w-2.5 rounded-full" />
            </span>
            <span className="text-primary-500 text-xs font-semibold tracking-wide uppercase">
              AI-Assisted Learning Experience Design
            </span>
          </div>

          <div className="glass-card space-y-6 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div>
              <h2 className="font-heading mb-2 text-2xl leading-tight font-bold text-white sm:text-3xl">
                Transform 6-Week Projects
                <span className="from-primary-500 via-primary-400 to-primary-500 mt-1 block bg-gradient-to-r bg-clip-text text-transparent">
                  Into 1-Hour Designs
                </span>
              </h2>
              <p className="text-sm text-white/70 font-sans">
                Join learning professionals who save 15+ hours per design
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MetricCard value="15x" label="Faster" icon={<Clock className="h-4 w-4" />} />
              <MetricCard value="98%" label="Time Saved" icon={<Sparkles className="h-4 w-4" />} />
              <MetricCard value="$0" label="To Start" icon={<Shield className="h-4 w-4" />} />
            </div>
          </div>
        </section>

        {/* LOGIN FORM CARD */}
        <div className="group relative">
          <div className="relative rounded-2xl border border-white/10 p-5 shadow-2xl md:p-6 lg:p-7 bg-white/[0.03] backdrop-blur-3xl">
            <div className="relative z-10">
              <div className="mb-6 space-y-2 text-left">
                <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Welcome Back
                </h1>
                <p className="text-xs text-white/60 font-sans">
                  Sign in to access your Learning Design Blueprints
                </p>
              </div>

              {params.error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400 text-center font-sans">{params.error}</p>
                </div>
              )}

              <div className="mb-5">
                <LoginForm action={login} />
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                <p className="text-left text-xs text-white/70 font-sans">
                  New to Smartslate?{' '}
                  <Link
                    href="/signup"
                    className="text-primary-500 hover:text-primary-400 font-semibold underline underline-offset-4 transition-colors duration-200"
                  >
                    Create free account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW - Glassmorphic Master Container */}
      <div className="relative z-10 mx-auto hidden w-full xl:flex xl:items-center xl:justify-center xl:px-4 xl:py-6">
        <div
          className="relative flex w-full max-w-[1200px] overflow-hidden rounded-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(167, 218, 219, 0.2)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 80px rgba(167, 218, 219, 0.1)',
            maxHeight: 'calc(100vh - 48px)',
          }}
        >
          <div className="relative z-10 flex h-full w-full">
            <aside className="w-[600px] flex-shrink-0 overflow-y-auto px-10 py-12 border-r border-white/10">
              <LoginMarketingSection />
            </aside>

            <div className="flex flex-1 items-center justify-center py-12 px-12">
              <div className="w-full max-w-md">
                <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-2xl">
                  <div className="relative z-10">
                    <div className="mb-8 space-y-2 text-left">
                      <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
                        Welcome Back
                      </h1>
                      <p className="text-sm text-white/60 font-sans">
                        Sign in to access your Learning Design Blueprints
                      </p>
                    </div>

                    {params.error && (
                      <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-sm text-red-400 text-center font-sans">{params.error}</p>
                      </div>
                    )}

                    <div className="mb-6">
                      <LoginForm action={login} />
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <p className="text-left text-xs text-white/70 font-sans">
                        New to Smartslate?{' '}
                        <Link
                          href="/signup"
                          className="text-primary-500 hover:text-primary-400 font-semibold underline underline-offset-4 transition-colors duration-200"
                        >
                          Create free account
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#020C1B] px-4 text-xs font-medium text-white/30 uppercase tracking-widest">
            or continue with
          </span>
        </div>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/50 uppercase tracking-wider ml-1">Email</label>
          <input
            name="email"
            type="email"
            required
            placeholder="name@company.com"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-sans"
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Password</label>
            <Link href="#" className="text-[10px] font-bold text-primary-500 uppercase tracking-widest hover:text-primary-400">
              Forgot?
            </Link>
          </div>
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-sans"
          />
        </div>
        <button
          type="submit"
          className="group relative w-full overflow-hidden rounded-xl bg-primary-500 px-6 py-3.5 text-sm font-bold text-[#020C1B] transition-all hover:bg-primary-400 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-[#020C1B] active:scale-[0.98]"
        >
          <span className="relative flex items-center justify-center gap-2">
            Sign In to Polaris
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </span>
        </button>
      </form>
    </div>
  );
}

function MetricCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur-sm">
      <div className="text-primary-500 mb-1 flex justify-center">{icon}</div>
      <div className="text-lg font-bold text-white leading-none mb-1">{value}</div>
      <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider">{label}</div>
    </div>
  );
}
