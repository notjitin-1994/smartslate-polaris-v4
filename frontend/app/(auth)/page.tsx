'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UsageStatsCard } from '@/components/dashboard/UsageStatsCard';
import { QuickActionsCardWithLimits } from '@/components/dashboard/QuickActionsCardWithLimits';
import { FeedbackCard } from '@/components/feedback';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { useUserUsage } from '@/lib/hooks/useUserUsage';
import { useAuth } from '@/contexts/AuthContext';
import { usePasswordCheck } from '@/lib/hooks/usePasswordCheck';
import { SetPasswordModal } from '@/components/auth/SetPasswordModal';

function DashboardContent() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { usage, loading: usageLoading } = useUserUsage();
  const { hasPassword, loading: passwordCheckLoading, checkPassword } = usePasswordCheck();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const loading = profileLoading || usageLoading;

  // Show password modal if user doesn't have a password
  useEffect(() => {
    if (!passwordCheckLoading && !hasPassword) {
      setShowPasswordModal(true);
    } else if (!passwordCheckLoading && hasPassword && showPasswordModal) {
      // Close modal once password is confirmed to be set
      setShowPasswordModal(false);
    }
  }, [passwordCheckLoading, hasPassword, showPasswordModal]);

  const handlePasswordSet = async () => {
    // Add a small delay to ensure the password metadata has propagated
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Recheck password status with retry logic built into the hook
    await checkPassword();

    // The useEffect will handle closing the modal when hasPassword becomes true
  };

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
      <div className="relative flex min-h-screen w-full flex-col bg-[#020C1B] text-[rgb(224,224,224)]">
        <div className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center">
                <div className="border-primary mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-t-transparent" />
                <p className="text-xl text-white/70">Loading your dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isLifetimeTier = profile?.subscription_tier === 'free';

  return (
    <>
      <SetPasswordModal
        open={showPasswordModal}
        email={user?.email}
        onSuccess={handlePasswordSet}
      />
      <div className="relative flex min-h-screen w-full flex-col bg-[#020C1B] text-[rgb(224,224,224)]">
        {/* Main Content Area */}
        <div className="flex-1">
          {/* Hero Section */}
          <section className="relative overflow-hidden">
            <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <div className="max-w-6xl text-left">
                {/* Welcome Message */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="mb-8"
                >
                  <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
                    <span>Welcome back, </span>
                    <span className="text-primary">{getFirstName()}</span>
                    <span className="text-white/80">.</span>
                  </h1>
                </motion.div>

                {/* Subtitle */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="mb-12"
                >
                  <p className="text-base leading-relaxed text-white/70 sm:text-lg md:text-xl lg:text-2xl">
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
                  transition={{ duration: 1, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="mt-16 h-px w-24"
                  style={{
                    background:
                      'linear-gradient(to right, transparent, var(--primary-accent), transparent)',
                  }}
                />
              </div>
            </div>
          </section>

          {/* Dashboard Content */}
          <div className="page-enter animate-fade-in-up animate-delay-75 relative z-10 mx-auto max-w-7xl px-4 py-4 pb-4 sm:px-6 sm:py-6 lg:px-8">
            {/* Top Row - Stats and Actions (Equal Width) */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Usage Stats */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <UsageStatsCard
                  creationCount={usage?.creationCount || 0}
                  creationLimit={usage?.creationLimit || 2}
                  savingCount={usage?.savingCount || 0}
                  savingLimit={usage?.savingLimit || 2}
                  subscriptionTier={usage?.subscriptionTier || profile?.subscription_tier || 'free'}
                  isLifetime={isLifetimeTier}
                />
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <QuickActionsCardWithLimits />
              </motion.div>
            </div>

            {/* Feedback Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mb-6"
            >
              <FeedbackCard />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
