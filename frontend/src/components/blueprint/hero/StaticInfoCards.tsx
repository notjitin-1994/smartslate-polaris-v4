'use client';

import React from 'react';
import { Sparkles, Brain, Lightbulb, Target, Zap, BookOpen, Cpu, Heart } from 'lucide-react';

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, title, description, className = '' }) => {
  return (
    <div
      className={`group relative flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/2 to-transparent p-8 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:shadow-2xl ${className} `}
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-700 group-hover:opacity-100">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
      </div>

      {/* Icon */}
      <div className="relative z-10 mb-6">
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-grow flex-col text-left">
        <h3 className="mb-3 text-xl leading-tight font-semibold text-white">{title}</h3>
        <p className="flex-grow text-base leading-relaxed text-white/70">{description}</p>
      </div>
    </div>
  );
};

interface StatProps {
  value: string;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
}

const Stat: React.FC<StatProps> = ({ value, label, trend = 'neutral' }) => {
  return (
    <div className="text-left">
      <div className="mb-1 text-3xl font-bold text-white">{value}</div>
      <div className="text-xs tracking-wider text-white/60 uppercase">{label}</div>
    </div>
  );
};

interface StaticElementProps {
  children: React.ReactNode;
  className?: string;
}

const StaticElement: React.FC<StaticElementProps> = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};

export { InfoCard, Stat, StaticElement };
