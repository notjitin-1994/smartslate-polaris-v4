'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Check, Loader2, ArrowUpRight } from 'lucide-react';
import { LoadingButton } from '../UI/LoadingButton';

interface InteractiveFormCardProps {
  toolCallId: string;
  questions: any[];
  isSubmitted: boolean;
  onSubmit: (data: Record<string, any>) => void;
  initialData?: Record<string, any>;
}

export function InteractiveFormCard({ toolCallId, questions, isSubmitted, onSubmit, initialData = {} }: InteractiveFormCardProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      layout 
      className={`glass-card p-6 rounded-[32px] border transition-all duration-500 ${
        isSubmitted ? 'border-primary-500/20 bg-primary-500/[0.02]' : 'border-white/[0.08] bg-[#020611]/80'
      } backdrop-blur-2xl shadow-2xl w-full max-w-2xl my-4`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.03] text-primary-400 border border-white/[0.08]">
            {isSubmitted ? <ShieldCheck size={16} /> : <Sparkles size={16} />}
          </div>
          <div>
            <h3 className="text-[14px] font-heading font-semibold text-white/95">Information Request</h3>
            <p className="text-[11px] text-white/40 font-light">Please provide details to proceed</p>
          </div>
        </div>
        {isSubmitting && <Loader2 size={12} className="animate-spin text-primary-500" />}
      </div>

      <div className="space-y-6">
        {questions.map((q) => (
          <div key={q.id} className="flex flex-col space-y-2">
            <label className="text-[12px] font-medium text-white/80">{q.label}</label>
            <input
              type="text"
              disabled={isSubmitted}
              value={formData[q.id] || ''}
              onChange={(e) => setFormData({ ...formData, [q.id]: e.target.value })}
              className="w-full bg-white/[0.02] border border-white/[0.08] px-4 py-3 rounded-xl text-[13px] text-white focus:border-primary-500/50 outline-none transition-all"
            />
          </div>
        ))}
      </div>

      {!isSubmitted && (
        <LoadingButton onClick={handleSubmit} loading={isSubmitting} className="w-full mt-8" icon={<ArrowUpRight size={16} />}>
          Submit Responses
        </LoadingButton>
      )}
    </motion.div>
  );
}
