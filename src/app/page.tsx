import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { starmaps } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus, Compass, Clock, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Fetch user's starmaps
  const userStarmaps = await db.query.starmaps.findMany({
    where: eq(starmaps.userId, user.id),
    orderBy: [desc(starmaps.updatedAt)],
  });

  if (userStarmaps.length === 0) {
    return redirect('/discovery/new');
  }

  return (
    <div className="min-h-[calc(100-64px)] bg-brand-bg p-6 sm:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-3xl font-bold font-heading text-white flex items-center gap-3">
              <Sparkles className="text-primary-500" size={28} />
              Your Workspace
            </h1>
            <p className="text-white/40 mt-1">Manage your AI-powered strategy blueprints</p>
          </div>
          <Link
            href="/discovery/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-brand-bg font-bold hover:bg-primary-400 transition-all shadow-[0_0_20px_rgba(167,218,219,0.2)]"
          >
            <Plus size={18} />
            New Discovery
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="glass-card p-6 rounded-2xl border-white/5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-1">Total Blueprints</p>
            <p className="text-3xl font-bold text-white font-mono">{userStarmaps.length}</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border-white/5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-1">In Progress</p>
            <p className="text-3xl font-bold text-primary-500 font-mono">
              {userStarmaps.filter(s => s.status === 'in_progress' || s.status === 'draft').length}
            </p>
          </div>
          <div className="glass-card p-6 rounded-2xl border-white/5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-1">Completed</p>
            <p className="text-3xl font-bold text-secondary-500 font-mono">
              {userStarmaps.filter(s => s.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Starmaps List */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest px-2 mb-4">Recent Sessions</h2>
          {userStarmaps.map((starmap) => (
            <Link
              key={starmap.id}
              href={`/discovery/${starmap.id}`}
              className="group block glass-card p-5 sm:p-6 rounded-2xl border-white/5 hover:border-primary-500/30 hover:bg-white/[0.03] transition-all relative overflow-hidden"
            >
              {/* Subtle background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    starmap.status === 'completed' 
                      ? 'bg-secondary-500/10 text-secondary-500' 
                      : 'bg-primary-500/10 text-primary-500'
                  }`}>
                    {starmap.status === 'completed' ? <CheckCircle2 size={24} /> : <Compass size={24} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors truncate">
                      {starmap.title || 'Untitled Starmap'}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        starmap.status === 'completed'
                          ? 'border-secondary-500/30 text-secondary-500 bg-secondary-500/5'
                          : 'border-primary-500/30 text-primary-500 bg-primary-500/5'
                      }`}>
                        {starmap.status?.replace('_', ' ')}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-white/30">
                        <Clock size={12} />
                        {new Date(starmap.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <ChevronRight size={20} className="text-white/10 group-hover:text-primary-500 transition-all group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
