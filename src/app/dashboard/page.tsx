import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { starmaps } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus, Compass, Clock, CheckCircle2, ChevronRight, Sparkles, LayoutGrid, Zap, History } from 'lucide-react';

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

  const getFirstName = () => {
    const rawName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || '';
    return rawName.split(' ')[0] || 'there';
  };

  return (
    <div className="relative min-h-screen bg-[#020C1B] text-[#e0e0e0] font-sans selection:bg-primary-500/30">
      {/* Background Decor */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-primary-500/5 blur-[120px]" />
        <div className="absolute top-[60%] -right-[5%] h-[30%] w-[30%] rounded-full bg-secondary-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
        {/* Hero Section */}
        <section className="mb-20">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-8 animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="h-px w-12 bg-primary-500/50" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary-500">Mission Control</span>
            </div>
            
            <h1 className="font-heading text-6xl md:text-8xl font-bold text-white tracking-tight mb-8 animate-in fade-in slide-in-from-top-4 duration-1000 delay-100">
              Welcome back, <span className="text-primary-500 italic font-serif">{getFirstName()}</span>.
            </h1>
            
            <p className="text-xl md:text-2xl text-white/50 font-light leading-relaxed max-w-3xl animate-in fade-in slide-in-from-top-4 duration-1000 delay-300">
              Your universe of learning strategy — <span className="text-white/90 font-medium">chart</span> starmaps, 
              <span className="text-white/90 font-medium"> orchestrate</span> constellations, and 
              <span className="text-white/90 font-medium"> discover</span> impactful instruction.
            </p>

            <div className="mt-12 h-px w-24 bg-primary-500/30 animate-in fade-in scale-x-0 origin-left duration-1000 delay-700 fill-mode-forwards" />
          </div>
        </section>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {/* Create New Card */}
          <Link 
            href="/discovery/new"
            className="group relative overflow-hidden rounded-[2rem] p-8 bg-primary-500 text-[#020C1B] transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(167,218,219,0.3)]"
          >
            <div className="relative z-10 h-full flex flex-col justify-between">
              <Plus size={32} strokeWidth={2.5} />
              <div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">New Discovery</h3>
                <p className="text-[#020C1B]/60 text-sm font-medium">Launch a fresh AI-powered strategy session.</p>
              </div>
            </div>
            {/* Aesthetic circle */}
            <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          </Link>

          {/* Stats Card */}
          <div className="rounded-[2rem] p-8 bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <LayoutGrid className="text-white/20" size={24} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Fleet Status</span>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-1">{userStarmaps.length}</div>
              <p className="text-white/40 text-sm font-light">Total active starmaps in your constellation.</p>
            </div>
          </div>

          {/* Efficiency Card */}
          <div className="rounded-[2rem] p-8 bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <Zap className="text-primary-500/40" size={24} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Impact</span>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-1">15x</div>
              <p className="text-white/40 text-sm font-light">Average acceleration in design cycle time.</p>
            </div>
          </div>
        </div>

        {/* Recent Starmaps */}
        <section>
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <History size={18} className="text-white/20" />
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/30">Recent Sessions</h2>
            </div>
          </div>

          {userStarmaps.length === 0 ? (
            <div className="text-center py-20 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.01]">
              <p className="text-white/20 font-light">No starmaps discovered yet. Start your first journey above.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {userStarmaps.map((starmap) => (
                <Link
                  key={starmap.id}
                  href={`/discovery/${starmap.id}`}
                  className="group block relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-500 hover:border-primary-500/30 hover:bg-white/[0.04]"
                >
                  <div className="relative z-10 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6 min-w-0">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-500 ${
                        starmap.status === 'completed' 
                          ? 'bg-secondary-500/10 text-secondary-500 group-hover:bg-secondary-500 group-hover:text-[#020C1B]' 
                          : 'bg-primary-500/10 text-primary-500 group-hover:bg-primary-500 group-hover:text-[#020C1B]'
                      }`}>
                        {starmap.status === 'completed' ? <CheckCircle2 size={24} /> : <Compass size={24} />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-white group-hover:text-primary-500 transition-colors truncate">
                          {starmap.title || 'Untitled Starmap'}
                        </h3>
                        <div className="flex items-center gap-4 mt-1.5">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            starmap.status === 'completed'
                              ? 'border-secondary-500/30 text-secondary-500 bg-secondary-500/5'
                              : 'border-primary-500/30 text-primary-500 bg-primary-500/5'
                          }`}>
                            {starmap.status?.replace('_', ' ')}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-white/20 font-light">
                            <Clock size={12} />
                            {new Date(starmap.updatedAt).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-white/10 group-hover:text-primary-500 transition-all duration-500 group-hover:translate-x-1" />
                  </div>
                  {/* Hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/[0.02] to-primary-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
