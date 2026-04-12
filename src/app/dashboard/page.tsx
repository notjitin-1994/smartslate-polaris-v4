import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { starmaps } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { 
  Plus, 
  Compass, 
  LayoutGrid, 
  Zap, 
} from 'lucide-react';
import { createStarmap } from '@/app/actions/starmap';
import { StarmapList } from '@/components/Dashboard/StarmapList';

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
    <div className="relative min-h-screen bg-[#020C1B] text-[#e0e0e0] font-sans selection:bg-primary-500/30 overflow-x-hidden flex flex-col pt-[var(--nav-height-mobile)] lg:pt-[var(--nav-height-desktop)]">
      {/* Background Decor - Ambient Lights */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] h-[60%] w-[50%] rounded-full bg-primary-500/5 blur-[150px]" />
        <div className="absolute top-[40%] right-[-10%] h-[50%] w-[40%] rounded-full bg-secondary-500/5 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[20%] h-[40%] w-[60%] rounded-full bg-primary-500/5 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-[var(--hero-padding-top)] pb-6 lg:py-8 flex flex-col flex-1">
        
        {/* Premium Dashboard Header - More compact */}
        <header className="mb-6 lg:mb-8 flex flex-col justify-end animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-2">
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
            
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Welcome back, <span className="text-primary-500 italic font-serif">{getFirstName()}</span>.
            </h1>
            <p className="text-white/50 text-sm sm:text-base font-light max-w-2xl hidden sm:block">
              Your command center for architecting high-impact learning experiences.
            </p>
          </div>
        </header>

        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 mb-6 lg:mb-8">
          
          {/* Main Action Card (Spans 8 cols on desktop) */}
          <div className="md:col-span-12 lg:col-span-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between group h-full min-h-[220px]">
              {/* Abstract structural graphics */}
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none">
                <svg width="150" height="150" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
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

              <div className="relative z-10 mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-500 mb-3 sm:mb-4">
                  <Compass size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Polaris Engine</span>
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                  Design your next <span className="text-primary-500 italic font-serif">masterpiece.</span>
                </h2>
                <p className="text-white/50 text-xs sm:text-sm max-w-md font-light leading-relaxed hidden sm:block">
                  Start a new AI-guided strategy session to map out learning objectives, constraints, and full curriculum blueprints in minutes.
                </p>
              </div>

              <div className="relative z-10">
                <form action={createStarmap}>
                  <button 
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-500 text-[#020C1B] font-bold transition-all hover:bg-primary-400 hover:shadow-[0_0_30px_rgba(167,218,219,0.4)] active:scale-[0.98] text-sm"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    <span className="tracking-wide">Start New Project</span>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Stats Column (Spans 4 cols on desktop) */}
          <div className="md:col-span-12 lg:col-span-4 flex flex-row lg:flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            
            {/* Fleet Status Card */}
            <div className="flex-1 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between hover:bg-white/[0.04] transition-colors duration-500 group">
              <div className="flex justify-between items-start mb-2 sm:mb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 block mb-0.5">Fleet Status</span>
                  <h3 className="text-white/70 font-medium text-xs sm:text-sm">Active Blueprints</h3>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
                  <LayoutGrid className="text-white/40 group-hover:text-white transition-colors" size={16} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tighter">{userStarmaps.length}</span>
                  <span className="text-[10px] font-medium text-white/30 uppercase tracking-widest hidden sm:inline">Total</span>
                </div>
                <div className="flex gap-3 mt-2 pt-2 border-t border-white/5">
                  <div>
                    <span className="text-white font-bold text-sm">{activeStarmaps}</span>
                    <span className="text-[10px] text-white/40 ml-1 uppercase tracking-wider">Drafts</span>
                  </div>
                  <div>
                    <span className="text-primary-500 font-bold text-sm">{completedStarmaps}</span>
                    <span className="text-[10px] text-white/40 ml-1 uppercase tracking-wider">Done</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Impact/Efficiency Card */}
            <div className="flex-1 rounded-[2rem] bg-gradient-to-br from-primary-500/[0.05] to-transparent border border-primary-500/10 backdrop-blur-xl p-5 sm:p-6 flex flex-col justify-between hover:border-primary-500/30 transition-colors duration-500 group">
              <div className="flex justify-between items-start mb-2 sm:mb-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary-500/50 block mb-0.5">Velocity</span>
                  <h3 className="text-white/70 font-medium text-xs sm:text-sm">Time Saved</h3>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 group-hover:bg-primary-500/20 transition-colors">
                  <Zap className="text-primary-500" size={16} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tighter">15</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary-500">x</span>
                </div>
                <p className="text-[10px] text-white/40 font-light mt-1.5 leading-relaxed hidden sm:block">
                  Average acceleration in design cycle time.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Starmaps Section - Replaces Recent Sessions with paginated list */}
        <div className="flex-1 min-h-0">
          <StarmapList initialStarmaps={userStarmaps} />
        </div>
      </div>
    </div>
  );
}
