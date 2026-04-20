'use client';

export const dynamic = 'force-dynamic';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { EnhancedUsageStatsCard } from '@/components/dashboard/EnhancedUsageStatsCard';
import { QuickActionsCardWithLimits } from '@/components/dashboard/QuickActionsCardWithLimits';
import { RecentBlueprintsCard } from '@/components/dashboard/RecentBlueprintsCard';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';

function DashboardContent() {
  const { user } = useAuth();
  const { profile, loading } = useUserProfile();

  // Get first name for welcome message
  const getFirstName = () => {
    if (profile?.first_name) {
      return profile.first_name;
    }
    const rawName =
      (user?.user_metadata?.first_name as string) ||
      (user?.user_metadata?.name as string) ||
      (user?.user_metadata?.full_name as string) ||
      (user?.email as string) ||
      '';
    return rawName.toString().trim().split(' ')[0] || 'there';
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#020C1B] text-white">
        <div className="relative flex flex-col items-center">
          {/* Constellation Sync Animation */}
          <div className="relative mb-8 h-24 w-24">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full border border-secondary/20 border-b-secondary"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-primary shadow-[0_0_15px_rgba(167,218,219,0.8)]"
              />
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="font-heading text-xl font-bold tracking-widest text-white/90 uppercase">
              Orchestrating Universe
            </h2>
            <div className="mt-2 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="h-1 w-1 rounded-full bg-primary"
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#020C1B] text-[rgb(224,224,224)]">
      {/* Main Content Area */}
      <div className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
            <div className="max-w-6xl text-left">
              {/* Welcome Message */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8"
              >
                <h1 className="font-heading lg:text-10xl text-7xl font-bold tracking-tight text-white sm:text-8xl md:text-9xl">
                  <span>Welcome back, </span>
                  <span className="text-primary">{getFirstName()}</span>
                  <span className="text-white/80">.</span>
                </h1>
              </motion.div>

              {/* Subtitle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="mb-12"
              >
                <p className="text-xl leading-relaxed text-white/70 sm:text-2xl lg:text-3xl">
                  Your mission control — <span className="text-primary font-medium">chart</span>{' '}
                  learning starmaps, <span className="text-primary font-medium">orchestrate</span>{' '}
                  your constellations,
                  <br />
                  and <span className="text-primary font-medium">discover</span> insights that
                  illuminate your training universe.
                </p>
              </motion.div>

              {/* Decorative Line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="bg-primary/50 mt-16 h-px w-24 origin-left"
              />
            </div>
          </div>
        </section>

        {/* Dashboard Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 pb-32 sm:px-6 lg:px-8">
          {/* Top Row - Stats and Actions (Equal Width) */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Usage Stats */}
            <motion.div
              initial={{ opacity: 0, x: -30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <EnhancedUsageStatsCard />
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <QuickActionsCardWithLimits />
            </motion.div>
          </div>

          {/* Bottom Row - Recent Starmaps (Full Width) */}
          <motion.div
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.75, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <RecentBlueprintsCard />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
