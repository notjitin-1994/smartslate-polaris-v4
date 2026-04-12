'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, Layout } from 'lucide-react';
import { LoadingButton } from '../UI/LoadingButton';

interface ApprovalCardProps {
  stageNumber: number;
  stageName: string;
  keyFindings: any[];
  insight: string;
  nextStage: string;
  state: 'input-available' | 'output-available' | 'input-streaming';
  onApprove: () => void;
  onReject: (feedback: string) => void;
}

export function ApprovalCard({ stageNumber, stageName, keyFindings, insight, nextStage, state, onApprove, onReject }: ApprovalCardProps) {
  const isSubmitted = state === 'output-available';

  return (
    <motion.div layout className="glass-card p-6 rounded-[32px] border border-white/[0.08] bg-[#020611]/80 backdrop-blur-2xl shadow-2xl w-full max-w-2xl my-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-500/10 text-primary-400 border border-primary-500/20">
          <Layout size={16} />
        </div>
        <div>
          <h3 className="text-[14px] font-heading font-semibold text-white/95">Stage {stageNumber} Complete</h3>
          <p className="text-[11px] text-white/40 font-light">{stageName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {keyFindings.map((finding, i) => (
          <div key={i} className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <p className="text-[9px] text-white/30 uppercase tracking-widest font-semibold mb-1">{finding.label}</p>
            <p className="text-[12px] text-white/80">{finding.value}</p>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-primary-500/5 border border-primary-500/10 mb-8 text-[12px] text-primary-300 italic font-light">
        "{insight}"
      </div>

      {!isSubmitted && (
        <div className="flex gap-3">
          <LoadingButton variant="secondary" onClick={() => onReject('I have some changes.')} className="flex-1">
            Re-evaluate
          </LoadingButton>
          <LoadingButton variant="primary" onClick={onApprove} className="flex-1" icon={<ArrowRight size={16} />}>
            Advance to {nextStage}
          </LoadingButton>
        </div>
      )}

      {isSubmitted && (
        <div className="flex items-center justify-center gap-2 py-2 text-primary-400 font-semibold text-[13px]">
          <CheckCircle2 size={16} /> Protocol Advanced
        </div>
      )}
    </motion.div>
  );
}
