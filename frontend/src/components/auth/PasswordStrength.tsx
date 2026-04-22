'use client';

import { useMemo } from 'react';
import type React from 'react';

type Props = {
  value: string;
};

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
  bgColor: string;
  description: string;
  gradient: string;
} {
  const metCount = criteria.filter((c) => c.met).length;

  if (metCount <= 2) {
    return {
      score: metCount,
      label: 'Weak',
      color: 'text-error',
      bgColor: 'bg-error/10',
      description: 'Needs significant improvement',
      gradient: 'from-error/20 to-error/10',
    };
  }
  if (metCount <= 3) {
    return {
      score: metCount,
      label: 'Fair',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      description: 'Almost there, add more variety',
      gradient: 'from-warning/20 to-warning/10',
    };
  }
  if (metCount <= 4) {
    return {
      score: metCount,
      label: 'Good',
      color: 'text-info',
      bgColor: 'bg-info/10',
      description: 'Solid password strength',
      gradient: 'from-info/20 to-info/10',
    };
  }
  return {
    score: metCount,
    label: 'Excellent',
    color: 'text-success',
    bgColor: 'bg-success/10',
    description: 'Outstanding password security',
    gradient: 'from-success/20 to-success/10',
  };
}

function CriteriaIcon({
  criterion,
  className = '',
}: {
  criterion: PasswordCriteria;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={`relative ${className}`}>
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all duration-300 ${
          criterion.met
            ? 'scale-100 bg-emerald-500/20 text-emerald-400'
            : 'scale-90 bg-white/5 text-white/30'
        }`}
      >
        {criterion.icon}
      </div>
      {criterion.met && (
        <div className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500">
          <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export function PasswordStrength({ value }: Props): React.JSX.Element | null {
  const criteria = useMemo(() => getPasswordCriteria(value), [value]);
  const strength = useMemo(() => getOverallStrength(criteria), [criteria]);

  if (!value) return null;

  return (
    <div className="animate-in slide-in-from-top-2 duration-500 ease-out">
      {/* Main strength card */}
      <div
        className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-500 ${strength.bgColor} ${strength.gradient} border-white/10`}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />

        {/* Content */}
        <div className="relative space-y-4 p-4">
          {/* Header with strength indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Animated strength bars */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i, index) => (
                  <div
                    key={i}
                    className={`h-2 w-6 rounded-full transition-all duration-700 ease-out ${
                      i <= strength.score
                        ? `${strength.color.replace('text-', 'bg-').replace('-400', '-500')} scale-100 shadow-lg`
                        : 'scale-75 bg-white/10'
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      transform: i <= strength.score ? 'scale(1)' : 'scale(0.75)',
                    }}
                  />
                ))}
              </div>
              <div
                className={`text-sm font-semibold transition-colors duration-300 ${strength.color}`}
              >
                {strength.label}
              </div>
            </div>

            {/* Animated pulse for active state */}
            <div
              className={`h-2 w-2 rounded-full ${strength.color.replace('text-', 'bg-')} animate-pulse`}
            />
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed text-white/80">{strength.description}</p>

          {/* Security tips for excellent passwords */}
          {strength.score >= 4 && (
            <div className="animate-in fade-in delay-200 duration-300">
              <div className="mb-2 flex items-center gap-2">
                <div className="bg-success h-1 w-4 rounded-full" />
                <span className="text-success text-xs font-medium">Security Tips</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {[
                  'Use unique passwords for each account',
                  'Consider a password manager',
                  'Enable 2FA when available',
                ].map((tip, index) => (
                  <div
                    key={tip}
                    className="animate-in slide-in-from-left flex items-center gap-2 text-xs text-white/70 duration-300"
                    style={{ animationDelay: `${300 + index * 100}ms` }}
                  >
                    <div className="h-1 w-1 flex-shrink-0 rounded-full bg-emerald-400" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="animate-in slide-in-from-bottom-2 delay-150 duration-500 ease-out">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-xs font-medium tracking-wider text-white/60 uppercase">
              Requirements
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="grid gap-2">
            {criteria.map((criterion, index) => (
              <div
                key={criterion.id}
                className={`animate-in slide-in-from-left flex items-center gap-3 rounded-xl p-2 transition-all duration-300 ${
                  criterion.met
                    ? 'bg-success/10 border-success/20 border'
                    : 'border border-white/10 bg-white/5 hover:bg-white/10'
                }`}
                style={{
                  animationDelay: `${200 + index * 50}ms`,
                  animationFillMode: 'both',
                }}
              >
                <CriteriaIcon criterion={criterion} />
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm font-medium transition-colors duration-200 ${
                      criterion.met ? 'text-success' : 'text-white/70'
                    }`}
                  >
                    {criterion.label}
                  </div>
                  <div className="mt-0.5 text-xs text-white/50">{criterion.description}</div>
                </div>

                {/* Animated completion indicator */}
                <div
                  className={`transition-all duration-300 ${
                    criterion.met ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                  }`}
                >
                  <svg className="text-success h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
