'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import type React from 'react';

interface FloatingPasswordHintsProps {
  show: boolean;
  password: string;
  targetRef: React.RefObject<HTMLElement | null>;
}

interface PasswordCriteria {
  id: string;
  label: string;
  met: boolean;
  description: string;
  icon: string;
}

function getPasswordCriteria(password: string): PasswordCriteria[] {
  const criteria: PasswordCriteria[] = [
    {
      id: 'length',
      label: '8+ Characters',
      met: password.length >= 8,
      description: 'Minimum length for security',
      icon: '📏',
    },
    {
      id: 'uppercase',
      label: 'Uppercase Letter',
      met: /[A-Z]/.test(password),
      description: 'Include A-Z for complexity',
      icon: '🔤',
    },
    {
      id: 'lowercase',
      label: 'Lowercase Letter',
      met: /[a-z]/.test(password),
      description: 'Include a-z for variety',
      icon: '🔡',
    },
    {
      id: 'number',
      label: 'Number',
      met: /\d/.test(password),
      description: 'Add digits for strength',
      icon: '🔢',
    },
    {
      id: 'special',
      label: 'Special Character',
      met: /[^a-zA-Z\d]/.test(password),
      description: 'Include !@#$%^&* symbols',
      icon: '⚡',
    },
  ];

  return criteria;
}

function getOverallStrength(criteria: PasswordCriteria[]): {
  score: number;
  label: string;
  color: string;
  description: string;
} {
  const metCount = criteria.filter((c) => c.met).length;

  if (metCount <= 2) {
    return {
      score: metCount,
      label: 'Weak',
      color: '#ef4444',
      description: 'Needs significant improvement',
    };
  }
  if (metCount <= 3) {
    return {
      score: metCount,
      label: 'Fair',
      color: '#f59e0b',
      description: 'Almost there, add more variety',
    };
  }
  if (metCount <= 4) {
    return {
      score: metCount,
      label: 'Good',
      color: '#3b82f6',
      description: 'Solid password strength',
    };
  }
  return {
    score: metCount,
    label: 'Excellent',
    color: '#10b981',
    description: 'Outstanding password security',
  };
}

export function FloatingPasswordHints({
  show,
  password,
  targetRef,
}: FloatingPasswordHintsProps): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isDesktop, setIsDesktop] = useState(false);

  const criteria = getPasswordCriteria(password);
  const strength = getOverallStrength(criteria);

  useEffect(() => {
    setMounted(true);
    setIsDesktop(window.innerWidth >= 1280);
  }, []);

  useEffect(() => {
    if (show && targetRef.current) {
      const updatePosition = () => {
        const rect = targetRef.current?.getBoundingClientRect();
        if (rect) {
          const desktop = window.innerWidth >= 1280;
          setIsDesktop(desktop);

          if (desktop) {
            // Position to the left of the form
            setPosition({
              top: rect.top - 20,
              left: rect.left - 420, // 400px width + 20px gap
            });
          } else {
            // On mobile, center horizontally and position below the password field
            const popupWidth = window.innerWidth - 32; // Account for padding
            setPosition({
              top: rect.bottom + 8,
              left: (window.innerWidth - popupWidth) / 2,
            });
          }
        }
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
    return undefined;
  }, [show, targetRef]);

  if (!mounted || typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed z-[100]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: isDesktop ? '400px' : 'calc(100vw - 32px)',
            maxWidth: isDesktop ? '400px' : 'calc(100vw - 32px)',
          }}
        >
          {/* Floating Card with Glassmorphism */}
          <div
            className="rounded-2xl border border-white/10 p-5 shadow-2xl"
            style={{
              background: 'rgba(2, 12, 27, 0.95)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5), 0 0 60px rgba(167, 218, 219, 0.15)',
            }}
          >
            {/* Glow Effect */}
            <div
              className="absolute inset-0 rounded-2xl opacity-40"
              style={{
                background:
                  'radial-gradient(ellipse at top left, rgba(167, 218, 219, 0.15), transparent 70%)',
              }}
              aria-hidden="true"
            />

            {/* Content */}
            <div className="relative z-10 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
                  <Info className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Password Requirements</h3>
                  <p className="mt-0.5 text-xs text-white/60">Create a secure password</p>
                </div>
              </div>

              {/* Strength Indicator */}
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/70">Strength</span>
                    <span
                      className="rounded-full px-2 py-1 text-xs font-bold"
                      style={{
                        color: strength.color,
                        backgroundColor: `${strength.color}20`,
                      }}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor:
                            i <= strength.score ? strength.color : 'rgba(255, 255, 255, 0.1)',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-white/50">{strength.description}</p>
                </div>
              )}

              {/* Requirements List */}
              <div className="space-y-2">
                {criteria.map((criterion) => (
                  <motion.div
                    key={criterion.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center gap-3 rounded-lg p-2.5 transition-all duration-200 ${
                      criterion.met
                        ? 'border border-emerald-500/20 bg-emerald-500/10'
                        : 'border border-white/10 bg-white/5'
                    }`}
                  >
                    <div
                      className={`text-base transition-transform duration-200 ${
                        criterion.met ? 'scale-110' : 'scale-100'
                      }`}
                    >
                      {criterion.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-medium transition-colors duration-200 ${
                          criterion.met ? 'text-emerald-400' : 'text-white/60'
                        }`}
                      >
                        {criterion.label}
                      </div>
                      <div className="mt-0.5 text-xs text-white/40">{criterion.description}</div>
                    </div>
                    {criterion.met && (
                      <motion.svg
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
                        className="h-4 w-4 flex-shrink-0 text-emerald-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </motion.svg>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Tips for Strong Passwords */}
              {strength.score >= 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">Great job!</span>
                  </div>
                  <ul className="space-y-1">
                    {[
                      'Use unique passwords for each account',
                      'Consider a password manager',
                      'Enable 2FA when available',
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-xs text-white/60">
                        <span className="mt-1 text-emerald-400/60">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
