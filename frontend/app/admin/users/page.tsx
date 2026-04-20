'use client';

export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Sparkles } from 'lucide-react';
import { UserManagementTable } from '@/components/admin/users/UserManagementTable';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Admin Users Management Page
 * Comprehensive user administration with advanced filtering, sorting, and bulk actions
 * Styled to match Smartslate Polaris v3 brand guidelines
 */

export default function UsersPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020c1b] via-[#0d1b2a] to-[#020c1b] px-3 py-6 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="space-y-6 sm:space-y-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#a7dadb]/20 bg-gradient-to-br from-[#a7dadb]/30 via-[#a7dadb]/20 to-transparent shadow-lg shadow-[#a7dadb]/20 sm:h-16 sm:w-16 sm:rounded-2xl">
                <Users className="h-6 w-6 text-[#a7dadb] sm:h-8 sm:w-8" />
              </div>
              <div className="flex-1">
                <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                  <span>User </span>
                  <span className="bg-gradient-to-r from-[#a7dadb] via-[#d0edf0] to-[#a7dadb] bg-clip-text text-transparent">
                    Management
                  </span>
                </h1>
                <p className="mt-2 text-base text-[#b0c5c6] sm:mt-3 sm:text-lg md:text-xl">
                  Comprehensive user administration, analytics, and access control
                </p>
              </div>
            </div>

            {/* Decorative line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#a7dadb]/30 to-transparent" />
          </motion.div>

          {/* User Management Table Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Suspense
              fallback={
                <div className="rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl sm:p-12">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#a7dadb]/20 border-t-[#a7dadb] sm:h-16 sm:w-16" />
                      <Sparkles className="absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 animate-pulse text-[#a7dadb] sm:h-6 sm:w-6" />
                    </div>
                    <div className="text-center">
                      <p className="font-heading text-base font-semibold text-white sm:text-lg">
                        Loading Users
                      </p>
                      <p className="mt-1 text-xs text-[#b0c5c6] sm:text-sm">
                        Fetching user data and analytics...
                      </p>
                    </div>
                  </div>
                </div>
              }
            >
              <UserManagementTable />
            </Suspense>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
