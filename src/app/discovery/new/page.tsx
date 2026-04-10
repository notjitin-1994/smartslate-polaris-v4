import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Bot, Sparkles, ArrowRight } from 'lucide-react';

async function createDiscovery() {
  'use server';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // TODO: Create starmap record in database
  // For now, redirect with a temporary ID
  const tempId = crypto.randomUUID();

  return redirect(`/discovery/${tempId}`);
}

export default async function NewDiscoveryPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4">
      <div className="w-full max-w-2xl text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-500/10 text-primary-500 mb-8">
          <Sparkles size={40} />
        </div>

        <h1 className="text-4xl font-bold font-heading text-white mb-4">
          Start Your Discovery Journey
        </h1>

        <p className="text-lg text-white/60 mb-12 max-w-xl mx-auto">
          Embark on an AI-powered exploration of your goals, challenges, and opportunities.
          Our intelligent guide will help you uncover insights and create a strategic blueprint.
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="glass-card rounded-xl p-6">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center mx-auto mb-4">
              <Bot size={24} />
            </div>
            <h3 className="text-white font-semibold mb-2">AI-Guided</h3>
            <p className="text-sm text-white/40">Intelligent questions tailored to your unique context</p>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="w-12 h-12 rounded-xl bg-secondary-500/10 text-secondary-500 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={24} />
            </div>
            <h3 className="text-white font-semibold mb-2">7-Stage Process</h3>
            <p className="text-sm text-white/40">Comprehensive discovery across all dimensions</p>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center mx-auto mb-4">
              <ArrowRight size={24} />
            </div>
            <h3 className="text-white font-semibold mb-2">Actionable Blueprint</h3>
            <p className="text-sm text-white/40">Get a clear strategy you can implement immediately</p>
          </div>
        </div>

        {/* CTA */}
        <form action={createDiscovery}>
          <button
            type="submit"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary-500 text-brand-bg font-semibold hover:bg-primary-400 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-brand-bg transition-all text-lg"
          >
            Begin Discovery
            <ArrowRight size={20} />
          </button>
        </form>

        <p className="mt-6 text-sm text-white/30">
          Takes approximately 15-20 minutes • No commitment required
        </p>
      </div>
    </div>
  );
}
