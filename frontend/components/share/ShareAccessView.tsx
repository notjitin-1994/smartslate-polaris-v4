/**
 * Share Access View Component
 * Client component that handles password validation and displays shared blueprint
 * Uses the same InteractiveBlueprintDashboard as the main blueprint viewer
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Download, Printer, Share2 } from 'lucide-react';
import { InteractiveBlueprintDashboard } from '@/components/features/blueprints/InteractiveBlueprintDashboard';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';

interface ShareAccessViewProps {
  shareLink: any;
  blueprint: any;
  requirePassword: boolean;
  requireEmail: boolean;
}

export default function ShareAccessView({
  shareLink,
  blueprint,
  requirePassword,
  requireEmail,
}: ShareAccessViewProps) {
  const [isUnlocked, setIsUnlocked] = useState(!requirePassword && !requireEmail);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Track view on mount (after access granted)
  useEffect(() => {
    if (isUnlocked) {
      trackView();
    }
  }, [isUnlocked]);

  // Handle scroll detection for floating menu visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show floating menu when scrolled down, hide when at top
      if (currentScrollY > 100) {
        setShowFloatingMenu(true);
      } else {
        setShowFloatingMenu(false);
        setMenuOpen(false); // Close menu when going back to top
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const trackView = async () => {
    try {
      await fetch(`/api/share/access/${shareLink.share_token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorEmail: email || undefined,
          sessionId,
        }),
      });
    } catch (err) {
      console.error('Failed to track view:', err);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/share/access/${shareLink.share_token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: requirePassword ? password : undefined,
          visitorEmail: email || undefined,
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Access denied');
        setLoading(false);
        return;
      }

      setIsUnlocked(true);
    } catch (err) {
      setError('Failed to verify access. Please try again.');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([blueprint.blueprint_markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blueprint.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blueprint.title,
          text: `Check out this blueprint: ${blueprint.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Failed to share:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // If access is locked, show access form
  if (!isUnlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">{shareLink.custom_title || blueprint.title}</h1>
            <p className="text-gray-600">
              {shareLink.custom_description ||
                'This content is protected. Please provide the required information to access it.'}
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            {requireEmail && (
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required={requireEmail}
                  />
                </div>
              </div>
            )}

            {requirePassword && (
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required={requirePassword}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Access Content'}
            </Button>
          </form>

          <div className="mt-6 border-t pt-6 text-center text-xs text-gray-500">
            <p>Shared via SmartSlate Polaris</p>
          </div>
        </div>
      </div>
    );
  }

  // Parse blueprint JSON
  const blueprintData = blueprint.blueprint_json
    ? typeof blueprint.blueprint_json === 'string'
      ? JSON.parse(blueprint.blueprint_json)
      : blueprint.blueprint_json
    : null;

  // Extract executive summary - ensure it's always a string
  let executiveSummary = 'No executive summary available.';

  if (blueprintData?.executive_summary) {
    const summary = blueprintData.executive_summary;

    if (typeof summary === 'string') {
      executiveSummary = summary;
    } else if (typeof summary === 'object') {
      // Try to extract text from common properties
      executiveSummary =
        summary.summary ||
        summary.content ||
        summary.text ||
        summary.overview ||
        JSON.stringify(summary);
    }
  }

  // Display blueprint content using the same component as the main viewer
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="glass-strong shadow-lg print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            {/* SmartSlate Logo */}
            <img
              src="/logo.png"
              alt="SmartSlate"
              className="h-7 w-auto drop-shadow-sm select-none"
              draggable="false"
            />
          </div>

          {/* Desktop action buttons - hidden on mobile */}
          <div className="flex items-center gap-2" suppressHydrationWarning>
            {shareLink.allow_download && (
              <Button variant="ghost" size="small" onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline" suppressHydrationWarning>
                  Download
                </span>
              </Button>
            )}

            {shareLink.allow_print && (
              <Button variant="ghost" size="small" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline" suppressHydrationWarning>
                  Print
                </span>
              </Button>
            )}

            <Button variant="ghost" size="small" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline" suppressHydrationWarning>
                Share
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* Blueprint Content - Using the exact same component as the main viewer */}
      <main className="relative w-full overflow-x-hidden">
        {/* Animated Background Pattern - matches main viewer */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-primary/10 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl md:animate-pulse" />
          <div className="bg-secondary/10 absolute -bottom-40 -left-40 h-80 w-80 rounded-full blur-3xl md:animate-pulse md:delay-1000" />
          <div className="bg-primary/5 absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl md:animate-pulse md:delay-500" />
        </div>

        {/* Title Section - matches main viewer */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="space-y-8">
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="font-heading text-foreground text-2xl leading-tight font-semibold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
                  style={{
                    fontSize: 'clamp(1.5rem, 4vw + 1rem, 4rem)',
                  }}
                >
                  {blueprint.title}
                </motion.h1>

                {/* Executive Summary - Matches main viewer exactly */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="relative"
                >
                  {/* Header */}
                  <div className="mb-4">
                    <h2 className="text-text-primary text-lg font-semibold sm:text-xl">
                      Executive Summary
                    </h2>
                  </div>

                  {/* Executive Summary Paragraphs - Responsive Typography */}
                  <div className="space-y-3 sm:space-y-4">
                    {(typeof executiveSummary === 'string'
                      ? executiveSummary
                      : String(executiveSummary)
                    )
                      .split(/\.\s+/)
                      .filter(Boolean)
                      .map((sentence: string, index: number) => (
                        <p
                          key={index}
                          className="text-text-secondary text-base leading-relaxed sm:text-lg md:text-xl"
                        >
                          {sentence.trim()}
                          {sentence.trim().endsWith('.') ? '' : '.'}
                        </p>
                      ))}
                  </div>
                </motion.div>

                {/* Metadata */}
                {blueprintData?.metadata && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                    className="flex flex-wrap items-center gap-2 sm:gap-3"
                  >
                    {blueprintData.metadata.organization && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
                        <span className="text-text-disabled">Organization:</span>
                        <span className="text-primary font-medium">
                          {blueprintData.metadata.organization}
                        </span>
                      </div>
                    )}

                    {blueprintData.metadata.role && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
                        <span className="text-text-disabled">Role:</span>
                        <span className="text-primary font-medium">
                          {blueprintData.metadata.role}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="text-text-secondary mt-4 flex items-center gap-4 text-sm">
                  <span>Created: {new Date(blueprint.created_at).toLocaleDateString()}</span>
                  {shareLink.permission_level && (
                    <span className="bg-primary/10 text-primary rounded px-2 py-1 text-xs font-medium">
                      {shareLink.permission_level} Access
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Blueprint Dashboard - Exact same component */}
        <section className="relative z-10 mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          {blueprintData ? (
            <InteractiveBlueprintDashboard
              blueprint={blueprintData}
              blueprintId={blueprint.id}
              isPublicView={true}
            />
          ) : (
            <div className="glass-card p-8 text-center">
              <h3 className="text-foreground mb-2 text-lg font-semibold">
                Blueprint Data Not Available
              </h3>
              <p className="text-text-secondary text-sm">
                The blueprint content could not be loaded. Please try refreshing the page.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Standard Footer Component */}
      <Footer />

      {/* Backdrop when menu is open */}
      {menuOpen && showFloatingMenu && (
        <div
          className="fixed inset-0 z-[9997] bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Hamburger Menu - Bottom Right (appears when scrolling) */}
      {showFloatingMenu && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed right-6 bottom-6 z-[9998] md:hidden print:hidden"
        >
          {/* Menu Options - shown when menuOpen is true */}
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="glass-strong absolute right-0 bottom-20 mb-2 min-w-[200px] overflow-hidden rounded-2xl shadow-xl"
            >
              <div className="flex flex-col p-2">
                {shareLink.allow_download && (
                  <button
                    onClick={() => {
                      handleDownload();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200 hover:bg-white/10"
                  >
                    <Download className="text-primary h-5 w-5" />
                    <span className="font-medium">Download</span>
                  </button>
                )}

                {shareLink.allow_print && (
                  <button
                    onClick={() => {
                      handlePrint();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200 hover:bg-white/10"
                  >
                    <Printer className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Print</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    handleShare();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200 hover:bg-white/10"
                >
                  <Share2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Share</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Hamburger Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="bg-primary shadow-primary/30 hover:shadow-primary/40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95"
            aria-label="Open actions menu"
          >
            <svg
              className="h-6 w-6 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </motion.div>
      )}

      {/* Analytics Notice if enabled */}
      {shareLink.show_analytics && (
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-4 text-center print:hidden">
          <p className="text-text-secondary text-xs">
            This page is being tracked for analytics purposes
          </p>
        </div>
      )}
    </div>
  );
}
