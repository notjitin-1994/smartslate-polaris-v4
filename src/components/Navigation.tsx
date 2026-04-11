'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sparkles, 
  Compass, 
  LogOut, 
  User, 
  LayoutDashboard, 
  ChevronDown, 
  Settings, 
  Bell,
  Search,
  Plus
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  requiresAuth: boolean;
}

export function Navigation() {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string; user_metadata?: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, requiresAuth: true },
    { href: '/discovery/new', label: 'Discovery', icon: <Compass size={16} />, requiresAuth: true },
  ];

  // Don't show nav on login/signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const getInitials = () => {
    if (!user?.email) return 'P';
    const name = user.user_metadata?.full_name || user.email;
    return name.charAt(0).toUpperCase();
  };

  return (
    <nav className="fixed top-0 z-[100] w-full border-b border-white/5 bg-[#020C1B]/80 backdrop-blur-2xl">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* LEFT: Branding & Search */}
          <div className="flex items-center gap-8 lg:gap-12">
            <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
              <div className="flex items-baseline relative">
                <img src="/logo.png" alt="SmartSlate" className="h-5 w-auto lg:h-6 object-contain self-center" />
                <span className="font-heading text-lg lg:text-xl font-bold tracking-tight text-white ml-2 leading-none self-end pb-[1px]">
                  <span className="text-primary-500">Polaris</span>
                </span>
                {/* Active Indicator Glow */}
                <div className="absolute -bottom-4 left-0 right-0 h-[2px] bg-primary-500 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </Link>

            {/* Subtle Search Bar (Industry Standard for 2026) */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.03] border border-white/5 text-white/20 group focus-within:border-primary-500/30 focus-within:bg-white/[0.05] transition-all duration-300 w-[280px]">
              <Search size={14} className="group-focus-within:text-primary-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Jump to blueprint..." 
                className="bg-transparent border-none outline-none text-xs text-white placeholder-white/20 w-full font-sans font-light"
              />
              <span className="text-[10px] font-bold text-white/10 px-1.5 py-0.5 rounded border border-white/5 uppercase">⌘K</span>
            </div>
          </div>

          {/* CENTER: Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              if (item.requiresAuth && !user) return null;

              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2.5 px-5 py-2 rounded-full text-[13px] font-bold tracking-wide uppercase transition-all duration-300 ${
                    isActive
                      ? 'text-primary-500'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="nav-active"
                      className="absolute inset-0 bg-primary-500/10 rounded-full border border-primary-500/20 shadow-[0_0_20px_rgba(167,218,219,0.1)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.icon}</span>
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* RIGHT: Actions & Profile */}
          <div className="flex items-center gap-3 sm:gap-6">
            {loading ? (
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                <div className="w-24 h-8 rounded-full bg-white/5 animate-pulse" />
              </div>
            ) : user ? (
              <>
                {/* Secondary Actions */}
                <div className="hidden sm:flex items-center gap-2 mr-2">
                  <button className="p-2.5 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-all duration-300">
                    <Bell size={18} />
                  </button>
                  <button className="p-2.5 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-all duration-300">
                    <Settings size={18} />
                  </button>
                </div>

                {/* Vertical Divider */}
                <div className="hidden sm:block w-px h-8 bg-white/5 mx-2" />

                {/* Profile Dropdown Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={`flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-2xl transition-all duration-300 border ${
                      isProfileOpen 
                        ? 'bg-white/10 border-white/20 shadow-xl' 
                        : 'bg-white/[0.03] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex flex-col items-end hidden lg:flex">
                      <span className="text-[11px] font-bold text-white tracking-tight leading-none">
                        {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-primary-500/70 mt-1">
                        Pro Tier
                      </span>
                    </div>
                    
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-[#020C1B] font-bold text-xs shadow-[0_0_15px_rgba(167,218,219,0.2)]">
                      {getInitials()}
                    </div>
                    <ChevronDown size={14} className={`text-white/20 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Premium Dropdown Menu */}
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-[240px] rounded-[1.5rem] bg-[#0A192F] border border-white/10 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden"
                      >
                        <div className="px-4 py-4 border-b border-white/5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-1">Authenticated as</p>
                          <p className="text-xs font-medium text-white truncate">{user.email}</p>
                        </div>
                        
                        <div className="py-2">
                          <button className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200">
                            <User size={16} />
                            <span>Public Profile</span>
                          </button>
                          <button className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200">
                            <Settings size={16} />
                            <span>Preferences</span>
                          </button>
                        </div>

                        <div className="pt-2 border-t border-white/5">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all duration-200"
                          >
                            <LogOut size={16} />
                            <span className="font-bold">Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="group relative px-6 py-2.5 rounded-full text-sm font-bold text-[#020C1B] overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-primary-500 group-hover:bg-primary-400 transition-colors" />
                <span className="relative z-10 flex items-center gap-2">
                  Sign In
                  <ArrowRight size={16} />
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function ArrowRight({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14m-7-7 7 7-7 7"/>
    </svg>
  );
}
