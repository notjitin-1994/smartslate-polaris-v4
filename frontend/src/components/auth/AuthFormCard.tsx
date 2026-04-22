import type React from 'react';

interface AuthFormCardProps {
  children: React.ReactNode;
}

export function AuthFormCard({ children }: AuthFormCardProps): React.JSX.Element {
  return (
    <div className="group relative">
      {/* Main card - premium glassmorphism - Optimized padding */}
      <div
        className="relative rounded-2xl border border-white/10 p-4 shadow-2xl sm:p-6 lg:p-6"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Gradient border overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
