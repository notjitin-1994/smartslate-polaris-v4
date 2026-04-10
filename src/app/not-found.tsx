import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default async function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-brand-bg p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 mx-auto mb-8">
          <Compass size={40} className="animate-spin-slow" />
        </div>
        
        <h1 className="text-4xl font-bold font-heading text-white mb-4">
          Lost in Space?
        </h1>
        
        <p className="text-white/40 mb-12">
          The coordinates you're looking for don't exist in our starmap.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-brand-bg font-bold hover:bg-primary-400 transition-all"
          >
            <Home size={18} />
            Back Home
          </Link>
          <Link
            href="/discovery/new"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
          >
            <Compass size={18} />
            New Discovery
          </Link>
        </div>
      </div>
    </div>
  );
}
