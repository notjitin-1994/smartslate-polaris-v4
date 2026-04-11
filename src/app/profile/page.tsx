import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AuthHeader } from '@/components/Auth/AuthHeader';
import { User, Mail, Briefcase, MapPin } from 'lucide-react';
import { db } from '@/lib/db';
import { userProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Fetch or default profile
  let profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id)
  });

  return (
    <div className="relative min-h-screen bg-[#020C1B] text-[#e0e0e0] font-sans selection:bg-primary-500/30 pt-24 pb-20">
      {/* Background Decor */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[20%] left-[20%] h-[30%] w-[30%] rounded-full bg-secondary-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <AuthHeader 
          title="Public Profile" 
          subtitle="Customize how others see you on the Polaris network."
        />

        <div className="mt-12 bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl">
          <form className="space-y-8">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-4xl font-bold text-[#020C1B] shadow-[0_0_30px_rgba(167,218,219,0.2)]">
                {user.email?.charAt(0).toUpperCase() || 'P'}
              </div>
              <div className="space-y-2">
                <button type="button" className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors">
                  Change Avatar
                </button>
                <p className="text-[10px] text-white/40">JPG, GIF or PNG. 1MB max.</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2 group">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1 group-focus-within:text-primary-500 transition-colors">
                  Full Name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="text"
                    defaultValue={profile?.fullName || user.user_metadata?.full_name || ''}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1 group-focus-within:text-primary-500 transition-colors">
                  Title / Role
                </label>
                <div className="relative">
                  <Briefcase size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="text"
                    placeholder="Instructional Designer"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex justify-end">
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl bg-primary-500 text-[#020C1B] font-bold text-sm hover:bg-primary-400 transition-all hover:shadow-[0_0_20px_rgba(167,218,219,0.3)]"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
