import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, Sparkles, Clock } from 'lucide-react';
import SwirlBackground from '@/components/SwirlBackground';
import { LoginMarketingSection } from '@/components/Auth/LoginMarketingSection';
import { GoogleButton } from '@/components/Auth/GoogleButton';
import { AuthHeader } from '@/components/Auth/AuthHeader';
import { AuthInput } from '@/components/Auth/AuthInput';
import { PasswordInput } from '@/components/Auth/PasswordInput';
import { AuthButton } from '@/components/Auth/AuthButton';

async function signup(formData: FormData) {
  'use server';

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (password !== confirmPassword) {
    return redirect('/signup?error=Passwords do not match');
  }

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

  return redirect('/dashboard');
}

export default async function SignupPage({
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

          {/* Right: Signup Form */}
          <main className="flex flex-col justify-center p-10 lg:p-12 overflow-y-auto scrollbar-none bg-black/20">
            <div className="w-full max-w-[320px] mx-auto space-y-6">
              <AuthHeader 
                title="Create Workspace" 
                subtitle="Join Polaris." 
              />

              {params.error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-2 duration-500">
                  <p className="text-[12px] text-red-400 font-medium text-center">{params.error}</p>
                </div>
              )}

              <div className="space-y-6">
                <GoogleButton />

                <div className="relative py-1 flex items-center">
                  <div className="flex-grow h-px bg-white/5" />
                  <span className="flex-shrink-0 px-3 text-[9px] font-bold text-white/10 uppercase tracking-[0.2em]">
                    or use email
                  </span>
                  <div className="flex-grow h-px bg-white/5" />
                </div>

                <form action={signup} className="space-y-4">
                  <AuthInput 
                    name="email" 
                    type="email" 
                    label="Work Email" 
                    placeholder="name@organization.com" 
                    required 
                  />
                  
                  <PasswordInput 
                    name="password" 
                    label="Choose Password" 
                    placeholder="••••••••" 
                    required 
                    minLength={6}
                  />

                  <PasswordInput 
                    name="confirmPassword" 
                    label="Verify Password" 
                    placeholder="••••••••" 
                    required 
                  />

                  <AuthButton text="Create Free Account" />
                </form>
              </div>

              <div className="pt-6 border-t border-white/5">
                <p className="text-[12px] text-white/30 font-light">
                  Already have a workspace?{' '}
                  <Link
                    href="/login"
                    className="text-primary-500 hover:text-primary-400 font-semibold underline underline-offset-4 decoration-primary-500/30 hover:decoration-primary-500 transition-all duration-300"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </main>
        </div>

        {/* MOBILE & TABLET VIEW */}
        <div className="xl:hidden w-full max-w-sm mx-auto space-y-6 flex flex-col items-center justify-center max-h-[95vh] overflow-y-auto scrollbar-none py-4">
          {/* Mobile Marketing Card */}
          <section className="w-full p-6 rounded-[1.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-2xl flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-baseline">
                <img src="/logo.png" alt="SmartSlate" className="h-4 w-auto object-contain self-center" />
                <h2 className="font-heading text-sm font-bold text-white tracking-tight ml-1 leading-none self-end">
                  <span className="text-primary-500">Polaris</span>
                </h2>
              </div>
            </div>
            
            <h1 className="font-heading text-xl font-bold text-white leading-tight mb-2">
              Join <span className="text-primary-500 italic">Polaris.</span>
            </h1>
            
            <div className="grid grid-cols-3 gap-2">
              <MetricCard value="15x" label="Faster" icon={<Clock className="h-3 w-3" />} />
              <MetricCard value="98%" label="AI" icon={<Sparkles className="h-3 w-3" />} />
              <MetricCard value="Free" label="Start" icon={<Shield className="h-3 w-3" />} />
            </div>
          </section>

          {/* Mobile Signup Card */}
          <div className="w-full p-6 rounded-[2rem] bg-black/40 border border-white/10 backdrop-blur-3xl shadow-2xl space-y-6 flex-shrink-0">
            <AuthHeader 
              title="Get Started" 
              subtitle="Build your blueprint." 
            />

            {params.error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-[12px] text-red-400 font-medium text-center">{params.error}</p>
              </div>
            )}

            <div className="space-y-6">
              <GoogleButton />
              
              <form action={signup} className="space-y-4">
                <AuthInput 
                  name="email" 
                  type="email" 
                  label="Email" 
                  placeholder="name@organization.com" 
                  required 
                />
                
                <PasswordInput 
                  name="password" 
                  label="Password" 
                  placeholder="••••••••" 
                  required 
                  minLength={6}
                />

                <PasswordInput 
                  name="confirmPassword" 
                  label="Verify Password" 
                  placeholder="••••••••" 
                  required 
                />

                <AuthButton text="Get Started" />
              </form>
            </div>

            <div className="pt-4 border-t border-white/5 text-center">
              <p className="text-[12px] text-white/30 font-light">
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

function MetricCard({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center backdrop-blur-md">
      <div className="text-primary-500/50 mb-1 flex justify-center">{icon}</div>
      <div className="text-base font-bold text-white tracking-tight leading-none mb-0.5">{value}</div>
      <div className="text-[8px] font-bold text-white/10 uppercase tracking-[0.1em]">{label}</div>
    </div>
  );
}
