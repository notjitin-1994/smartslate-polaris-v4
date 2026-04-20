'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Lightbulb, Target, Zap, BookOpen, Cpu, Heart } from 'lucide-react';

interface AnimatedInfoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  className?: string;
}

const AnimatedInfoCard: React.FC<AnimatedInfoCardProps> = ({
  icon,
  title,
  description,
  delay,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: delay,
        type: 'spring',
        stiffness: 100,
        damping: 10,
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3 },
      }}
      className={`group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/2 to-transparent p-6 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:shadow-2xl ${className} `}
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* Animated Background Glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-700 group-hover:opacity-100">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
      </div>

      {/* Icon */}
      <motion.div
        className="relative z-10 mb-4"
        animate={{
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 4,
          delay: delay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-3">
          {icon}
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 text-left">
        <h3 className="mb-2 text-lg leading-tight font-semibold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-white/70">{description}</p>
      </div>

      {/* Hover Effect Particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-white/40"
            initial={{
              x: Math.random() * 100,
              y: Math.random() * 100,
              opacity: 0,
            }}
            whileHover={{
              opacity: [0, 1, 0],
              scale: [0, 2, 0],
              transition: { duration: 2, delay: i * 0.2 },
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

interface AnimatedStatProps {
  value: string;
  label: string;
  delay: number;
  trend?: 'up' | 'down' | 'neutral';
}

const AnimatedStat: React.FC<AnimatedStatProps> = ({ value, label, delay, trend = 'neutral' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: delay }}
      className="text-left"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, delay: delay + 0.2, type: 'spring' }}
        className="mb-1 text-3xl font-bold text-white"
      >
        {value}
      </motion.div>
      <div className="text-xs tracking-wider text-white/60 uppercase">{label}</div>
    </motion.div>
  );
};

interface FloatingElementProps {
  children: React.ReactNode;
  duration: number;
  delay: number;
  distance: number;
  className?: string;
}

const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  duration,
  delay,
  distance,
  className = '',
}) => {
  return (
    <motion.div
      animate={{
        y: [0, -distance, 0],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export { AnimatedInfoCard, AnimatedStat, FloatingElement };
