import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { starmaps } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { 
  Plus, 
  Compass, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  LayoutGrid, 
  Zap, 
  History,
  TrendingUp,
  Activity,
  ArrowRight
} from 'lucide-react';

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

  const activeStarmaps = userStarmaps.filter(s => s.status !== 'completed').length;
  const completedStarmaps = userStarmaps.length - activeStarmaps;

  // Format current date for the header
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="relative min-h-screen bg-[#020C1B] text-[#e0e0e0] font-sans selection:bg-primary-500/30 pb-20">
      {/* Background Decor - Ambient Lights */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] h-[60%] w-[50%] rounded-full bg-primary-500/5 blur-[150px]" />
        <div className="absolute top-[40%] right-[-10%] h-[50%] w-[40%] rounded-full bg-secondary-500/5 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[20%] h-[40%] w-[60%] rounded-full bg-primary-500/5 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-12 lg:py-12">
        
        {/* Premium Dashboard Header */}
        <header className="mb-12 lg:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-500">
                  {today}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 backdrop-blur-md">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">
                  System Online
                </span>
              </div>
            </div>
            
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Welcome back, <span className="text-primary-500 italic font-serif">{getFirstName()}</span>.
            </h1>
            <p className="text-white/50 text-lg font-light max-w-2xl">
              Your command center for architecting high-impact learning experiences.
            </p>
          </div>
        </header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 mb-16">
          
          {/* Main Action Card (Spans 8 cols on desktop) */}
          <div className="md:col-span-12 lg:col-span-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            <div className="relative h-full overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between group">
              {/* Abstract structural graphics */}
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity duration-700">
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 0L200 100L100 200L0 100L100 0Z" stroke="url(#paint0_linear)" strokeWidth="2" strokeDasharray="4 4"/>
                  <circle cx="100" cy="100" r="60" stroke="url(#paint1_linear)" strokeWidth="1"/>
                  <defs>
                    <linearGradient id="paint0_linear" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#A7DADB"/>
                      <stop offset="1" stopColor="#A7DADB" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="paint1_linear" x1="40" y1="40" x2="160" y2="160" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4F46E5"/>
                      <stop offset="1" stopColor="#4F46E5" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className="relative z-10 mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-500 mb-6">
                  <Compass size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Polaris Engine</span>
                </div>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                  Design your next <br/><span className="text-primary-500 italic font-serif">masterpiece.</span>
                </h2>
                <p className="text-white/50 text-sm sm:text-base max-w-md font-light leading-relaxed">
                  Start a new AI-guided strategy session to map out learning objectives, constraints, and full curriculum blueprints in minutes.
                </p>
              </div>

              <div className="relative z-10">
                <Link 
                  href="/discovery/new"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary-500 text-[#020C1B] font-bold transition-all hover:bg-primary-400 hover:shadow-[0_0_40px_rgba(167,218,219,0.4)] active:scale-[0.98]"
                >
                  <Plus size={20} strokeWidth={2.5} />
                  <span className="tracking-wide">Start New Project</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Column (Spans 4 cols on desktop) */}
          <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            
            {/* Fleet Status Card */}
            <div className="flex-1 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-xl p-8 flex flex-col justify-between hover:bg-white/[0.04] transition-colors duration-500 group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 block mb-1">Fleet Status</span>
                  <h3 className="text-white/70 font-medium">Active Blueprints</h3>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
                  <LayoutGrid className="text-white/40 group-hover:text-white transition-colors" size={20} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-heading font-bold text-white tracking-tighter">{userStarmaps.length}</span>
                  <span className="text-sm font-medium text-white/30 uppercase tracking-widest">Total</span>
                </div>
                <div className="flex gap-4 mt-4 pt-4 border-t border-white/5">
                  <div>
                    <span className="text-white font-bold">{activeStarmaps}</span>
                    <span className="text-xs text-white/40 ml-1.5 uppercase tracking-wider">Drafts</span>
                  </div>
                  <div>
                    <span className="text-primary-500 font-bold">{completedStarmaps}</span>
                    <span className="text-xs text-white/40 ml-1.5 uppercase tracking-wider">Done</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact/Efficiency Card */}
            <div className="flex-1 rounded-[2.5rem] bg-gradient-to-br from-primary-500/[0.05] to-transparent border border-primary-500/10 backdrop-blur-xl p-8 flex flex-col justify-between hover:border-primary-500/30 transition-colors duration-500 group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-500/50 block mb-1">Velocity</span>
                  <h3 className="text-white/70 font-medium">Time Saved</h3>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 group-hover:bg-primary-500/20 transition-colors">
                  <Zap className="text-primary-500" size={20} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-heading font-bold text-white tracking-tighter">15</span>
                  <span className="text-3xl font-bold text-primary-500">x</span>
                </div>
                <p className="text-xs text-white/40 font-light mt-3 leading-relaxed">
                  Average acceleration in design cycle time compared to traditional workflows.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Recent Starmaps Section */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div className="flex items-center justify-between mb-8 px-2 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                <History size={16} className="text-white/50" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Recent Sessions</h2>
            </div>
            {userStarmaps.length > 0 && (
              <span className="text-xs text-white/30 font-medium bg-white/5 px-3 py-1 rounded-full border border-white/10">
                Showing latest {Math.min(userStarmaps.length, 5)}
              </span>
            )}
          </div>

          {userStarmaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 rounded-[2.5rem] border border-dashed border-white/10 bg-white/[0.01]">
              <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Compass size={32} className="text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No transmissions yet.</h3>
              <p className="text-white/40 font-light max-w-md text-center mb-8">
                Your constellation is currently empty. Initiate your first discovery session to begin mapping your learning architecture.
              </p>
              <Link 
                href="/discovery/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
              >
                <Sparkles size={16} />
                <span>Start Exploring</span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {userStarmaps.slice(0, 5).map((starmap) => (
                <Link
                  key={starmap.id}
                  href={`/discovery/${starmap.id}`}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] overflow-hidden"
                >
                  {/* Hover Accent Line */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 opacity-0 transform -translate-x-full group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                  
                  <div className="flex items-center gap-5 min-w-0">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                      starmap.status === 'completed' 
                        ? 'bg-secondary-500/10 text-secondary-500 group-hover:bg-secondary-500 group-hover:text-white shadow-[0_0_20px_rgba(79,70,229,0.0)] group-hover:shadow-[0_0_20px_rgba(79,70,229,0.3)]' 
                        : 'bg-primary-500/10 text-primary-500 group-hover:bg-primary-500 group-hover:text-[#020C1B] shadow-[0_0_20px_rgba(167,218,219,0.0)] group-hover:shadow-[0_0_20px_rgba(167,218,219,0.3)]'
                    }`}>
                      {starmap.status === 'completed' ? <CheckCircle2 size={20} strokeWidth={2.5} /> : <Activity size={20} strokeWidth={2.5} />}
                    </div>
                    
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white group-hover:text-primary-400 transition-colors truncate mb-1">
                        {starmap.title || 'Untitled Strategy Blueprint'}
                      </h3>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-white/40 flex items-center gap-1.5 font-light">
                          <Clock size={12} />
                          {new Date(starmap.updatedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:pl-4 sm:border-l border-white/5">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                      starmap.status === 'completed'
                        ? 'border-secondary-500/20 text-secondary-400 bg-secondary-500/10'
                        : 'border-primary-500/20 text-primary-500 bg-primary-500/10'
                    }`}>
                      {starmap.status === 'completed' ? (
                        <><CheckCircle2 size={10} /> Finished</>
                      ) : (
                        <><TrendingUp size={10} /> In Progress</>
                      )}
                    </span>
                    
                    <div className="h-8 w-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                      <ArrowRight size={14} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
