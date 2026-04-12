'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, ShieldCheck, Zap, Target, Users, FileText, Activity, ArrowRight, Loader2, Sparkles, LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'target': Target,
  'users': Users,
  'zap': Zap,
  'file-text': FileText,
  'activity': Activity,
  'check': Check,
  'shield': ShieldCheck,
  'sparkles': Sparkles,
};

interface KeyFinding {
  label: string;
  value: string;
  icon?: string;
}

interface ApprovalCardProps {
  stageNumber: number;
  stageName: string;
  keyFindings: KeyFinding[];
  insight: string;
  nextStage: string;
  state?: string;
  onApprove: () => void;
  onReject: (feedback: string) => void;
}

export function ApprovalCard({ 
  stageNumber, 
  stageName, 
  keyFindings = [], 
  insight, 
  nextStage, 
  state, 
  onApprove, 
  onReject 
}: ApprovalCardProps) {
  const isStreaming = state === 'input-streaming';
  const isComplete = state === 'output-available';

  if (isStreaming) {
    return (
      <div className="glass-card p-6 rounded-3xl border border-white/[0.05] bg-white/[0.01] backdrop-blur-xl my-6 flex items-center gap-4 shadow-2xl">
        <div className="relative">
          <div className="absolute inset-0 bg-primary-500/20 blur-lg rounded-full animate-pulse" />
          <Loader2 size={20} className="text-primary-500 animate-spin relative z-10" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Protocol Logic</p>
          <p className="text-xs text-white/60 font-light italic">Synthesizing stage results...</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-5 rounded-2xl border border-primary-500/20 bg-primary-500/[0.02] my-6 flex items-center justify-between shadow-xl"
      >
        <div className="flex items-center gap-3 text-primary-400">
          <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
            <Check size={16} strokeWidth={3} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50">Validation Secure</p>
            <p className="text-[11px] font-semibold tracking-wide italic">Stage {stageNumber} confirmed. Initiating {nextStage}.</p>
          </div>
        </div>
        <ArrowRight size={14} className="text-primary-500/40" />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="glass-card p-[1px] rounded-[32px] border border-white/[0.08] bg-[#020611]/90 backdrop-blur-3xl my-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-2xl relative overflow-hidden group"
    >
      {/* Decorative detail */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Target size={120} />
      </div>

      <div className="p-8 relative z-10 bg-[#020611]/40 rounded-[31px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500 shadow-[0_0_20px_rgba(167,218,219,0.15)] relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-transparent opacity-50" />
              <ShieldCheck size={22} className="relative z-10" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary-500/60">Stage {stageNumber} Complete</span>
                <div className="w-1 h-1 rounded-full bg-white/10" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Analysis Verified</span>
              </div>
              <h2 className="text-xl font-heading font-black text-white tracking-tight uppercase tracking-widest">{stageName}</h2>
            </div>
          </div>
          <div className="hidden sm:block px-4 py-1.5 rounded-full border border-white/5 bg-white/[0.02] text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
            Protocol v4.0
          </div>
        </div>

        {/* Infographic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {keyFindings.map((finding, idx) => {
            const Icon = ICON_MAP[finding.icon || 'file-text'] || FileText;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all duration-300 group/item flex items-start gap-4"
              >
                <div className="mt-1 w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/30 group-hover/item:text-primary-400 group-hover/item:border-primary-500/20 transition-all duration-500">
                  <Icon size={14} />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{finding.label}</p>
                  <p className="text-[13px] text-white/80 leading-snug font-light tracking-wide">{finding.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Strategy Nugget Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-3xl bg-gradient-to-br from-primary-500/10 to-transparent border border-primary-500/20 mb-10 relative overflow-hidden shadow-inner"
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
            <Sparkles size={40} className="text-primary-500" />
          </div>
          <div className="flex items-center gap-2.5 mb-3">
            <Zap size={14} className="text-primary-500" fill="currentColor" />
            <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em]">Strategy Nugget</h4>
          </div>
          <p className="text-[13px] text-white/90 leading-relaxed font-light italic tracking-wide">
            &quot;{insight}&quot;
          </p>
        </motion.div>

        {/* Footer & Actions */}
        <div className="flex flex-col gap-6 pt-6 border-t border-white/[0.05]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Ready to initiate</span>
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 rounded bg-primary-500/10 border border-primary-500/20 text-primary-500 text-[9px] font-black uppercase tracking-widest">Stage {stageNumber + 1}</div>
                <span className="text-xs font-bold text-white/60 tracking-wide">{nextStage}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onApprove}
              className="flex-1 h-12 rounded-2xl bg-white text-[#020611] text-[13px] font-black uppercase tracking-[0.15em] hover:bg-primary-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-500 active:scale-[0.98] flex items-center justify-center gap-3 group/approve"
            >
              Approve & Continue
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onReject('I need to refine the details of this stage.')}
              className="w-12 h-12 rounded-2xl border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all duration-500 text-white/30 flex items-center justify-center active:scale-95"
              aria-label="Request changes"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
