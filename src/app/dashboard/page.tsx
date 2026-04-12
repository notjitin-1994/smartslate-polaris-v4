import { db } from '@/lib/db';
import { starmaps } from '@/lib/db/schema';
import { eq, desc, and, count } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { 
  Plus, 
  Compass, 
  Zap, 
  LayoutGrid, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Activity,
  Search,
  Star,
  Settings,
  Shield,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { StarmapList } from '@/components/Dashboard/StarmapList';
import { LoadingButton } from '@/components/UI/LoadingButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's starmaps
  const userStarmaps = await db.query.starmaps.findMany({
    where: eq(starmaps.userId, user.id),
    orderBy: [desc(starmaps.createdAt)],
    with: {
      starmapResponses: true
    }
  });

  const activeStarmaps = userStarmaps.filter(s => s.status === 'draft').length;
  const completedStarmaps = userStarmaps.filter(s => s.status === 'completed').length;

  // Server Action for creating a new starmap
  async function createStarmap() {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const [newStarmap] = await db.insert(starmaps).values({
      userId: user.id,
      title: 'Untitled Strategy Blueprint',
      status: 'draft',
      context: { currentStage: 1 }
    }).returning();

    redirect(`/discovery/${newStarmap.id}`);
  }

  return (
    <div className="min-h-screen bg-[#020611] flex flex-col">
      {/* Main Dashboard Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative pt-16 sm:pt-20">
        {/* Background Ambient Glows */}
        <div className="absolute top-[-10%] -left-[10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
        <div className="absolute bottom-[10%] -right-[10%] w-[30%] h-[30%] bg-secondary-500/10 rounded-full blur-[120px] pointer-events-none opacity-30" />

        <header className="px-6 sm:px-8 lg:px-12 pt-8 sm:pt-10 pb-6 relative z-10">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight uppercase">
              Mission <span className="text-primary-500 italic font-serif lowercase tracking-normal px-1">control</span>
            </h1>
            <p className="text-white/50 text-sm sm:text-base font-light max-w-2xl hidden sm:block">
              Your command center for architecting high-impact learning experiences.
            </p>
          </div>
        </header>

        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 mb-6 lg:mb-8 px-6 sm:px-8 lg:px-12">

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
                  <LoadingButton
                    type="submit"
                    loadingText="Architecting..."
                    icon={<Plus size={18} strokeWidth={2.5} />}
                  >
                    Start New Project
                  </LoadingButton>
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
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tighter">14.5h</span>
                  <span className="text-[10px] font-medium text-primary-500/40 uppercase tracking-widest hidden sm:inline">Saved</span>
                </div>
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
                  <ArrowUpRight size={12} className="text-primary-500" />
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">24% increase vs. manual</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Starmap List Section */}
        <section className="px-6 sm:px-8 lg:px-12 pb-12 relative z-10">
          <StarmapList initialStarmaps={userStarmaps} />
        </section>
      </main>
    </div>
  );
}
