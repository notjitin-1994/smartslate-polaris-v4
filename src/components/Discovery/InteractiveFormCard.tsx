'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, ChevronDown, Calendar as CalendarIcon, ShieldCheck, Loader2, ArrowUpRight } from 'lucide-react';
import { LoadingButton } from '../UI/LoadingButton';

export type QuestionType = 'text' | 'textarea' | 'select' | 'slider' | 'date';

export interface InteractiveQuestion {
  id: string;
  type: QuestionType;
  label: string;
  description?: string;
  options?: string[];
  min?: number;
  max?: number;
  required?: boolean;
}

interface InteractiveFormCardProps {
  toolCallId: string;
  questions: InteractiveQuestion[];
  isSubmitted: boolean;
  onSubmit: (data: Record<string, any>) => void;
  onUpdate: (toolCallId: string, data: Record<string, any>) => void;
  initialData?: Record<string, any>;
}

export function InteractiveFormCard({
  toolCallId,
  questions,
  isSubmitted,
  onSubmit,
  onUpdate,
  initialData = {}
}: InteractiveFormCardProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    onUpdate(toolCallId, formData);
  }, [formData, toolCallId]);

  const handleChange = (id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Glassmorphic high-tech styling
  return (
    <motion.div 
      layout 
      className={`glass-card p-[1.5px] rounded-[24px] md:rounded-[32px] border transition-all duration-500 ${
        isSubmitted 
          ? 'border-primary-500/20 bg-primary-500/[0.02]' 
          : 'border-white/[0.08] bg-[#020611]/80'
      } backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full max-w-2xl relative overflow-hidden group my-2 md:my-4`}
    >
      {/* Decorative gradient orb */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary-500/10 rounded-full blur-[60px] pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />
      
      <div className="p-5 md:p-6 relative z-10 bg-[#020611]/40 rounded-[22.5px] md:rounded-[31px] h-full">
        <div className="flex items-center justify-between mb-5 md:mb-6">
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
              isSubmitted ? 'bg-primary-500/20 text-primary-400' : 'bg-white/[0.03] text-primary-400'
            } border border-white/[0.08] shadow-[0_0_20px_rgba(167,218,219,0.05)]`}>
              {isSubmitted ? <ShieldCheck size={16} /> : <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={2} />}
            </div>
            <div>
              <h3 className="text-[13px] md:text-[14px] font-heading font-semibold text-white/95 tracking-wide leading-tight">
                {isSubmitted ? 'Protocol Synced' : 'Information Request'}
              </h3>
              <p className="text-[10px] md:text-[11px] text-white/40 font-light tracking-wide mt-0.5">
                {isSubmitted ? 'Data verified and logged to Starmap' : 'Please provide details to proceed'}
              </p>
            </div>
          </div>
          
          {isSubmitting && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20">
              <Loader2 size={10} className="animate-spin text-primary-500" />
              <span className="text-[8px] font-black text-primary-500 uppercase tracking-widest">Transmitting</span>
            </div>
          )}
        </div>

        <div className={`space-y-5 md:space-y-6 transition-opacity duration-500 ${isSubmitting ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          {questions.map((q, idx) => (
            <motion.div 
              layout
              key={q.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col space-y-1.5 md:space-y-2 relative"
            >
              <label className="text-[11px] md:text-[12px] font-medium text-white/80 flex items-center justify-between tracking-wide">
                <span>{q.label} {q.required && <span className="text-primary-500/70 ml-0.5 md:ml-1 font-bold">*</span>}</span>
                {isSubmitted && formData[q.id] && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-primary-500/20 p-0.5 md:p-1 rounded-full">
                    <Check className="w-2 h-2 md:w-2.5 md:h-2.5 text-primary-400" />
                  </motion.div>
                )}
              </label>
              
              {q.description && (
                <p className="text-[9px] md:text-[10px] text-white/30 leading-relaxed font-light">{q.description}</p>
              )}

              <div className="relative group/input mt-0.5 md:mt-1">
                {q.type === 'text' && (
                  <input
                    type="text"
                    disabled={isSubmitted}
                    value={formData[q.id] || ''}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.08] px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl text-[12px] md:text-[13px] text-white/90 placeholder-white/20 focus:outline-none focus:border-primary-500/50 focus:bg-white/[0.04] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed font-light tracking-wide shadow-inner"
                    placeholder="Type your answer..."
                  />
                )}

                {q.type === 'textarea' && (
                  <textarea
                    disabled={isSubmitted}
                    value={formData[q.id] || ''}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    rows={2}
                    className="w-full bg-white/[0.02] border border-white/[0.08] px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl text-[12px] md:text-[13px] text-white/90 placeholder-white/20 focus:outline-none focus:border-primary-500/50 focus:bg-white/[0.04] transition-all duration-300 resize-none disabled:opacity-40 disabled:cursor-not-allowed font-light tracking-wide shadow-inner"
                    placeholder="Provide details..."
                  />
                )}

                {q.type === 'select' && (
                  <div className="relative">
                    <select
                      disabled={isSubmitted}
                      value={formData[q.id] || ''}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/[0.08] px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl text-[12px] md:text-[13px] text-white/90 focus:outline-none focus:border-primary-500/50 focus:bg-white/[0.04] transition-all duration-300 appearance-none disabled:opacity-40 disabled:cursor-not-allowed font-light tracking-wide shadow-inner"
                    >
                      <option value="" disabled className="bg-[#020C1B] text-white/40">Select an option...</option>
                      {q.options?.map(opt => (
                        <option key={opt} value={opt} className="bg-[#020C1B] text-white/90">{opt}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 md:right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none transition-transform duration-300 group-focus-within/input:text-primary-500 w-3.5 h-3.5 md:w-4 md:h-4" />
                  </div>
                )}

                {q.type === 'date' && (
                  <div className="relative">
                    <input
                      type="date"
                      disabled={isSubmitted}
                      value={formData[q.id] || ''}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/[0.08] px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl text-[12px] md:text-[13px] text-white/90 placeholder-white/20 focus:outline-none focus:border-primary-500/50 focus:bg-white/[0.04] transition-all duration-300 [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed font-light tracking-wide shadow-inner"
                    />
                    <CalendarIcon className="absolute right-3.5 md:right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none transition-colors duration-300 group-focus-within/input:text-primary-500 w-3.5 h-3.5 md:w-4 md:h-4" />
                  </div>
                )}

                {q.type === 'slider' && (
                  <div className="pt-1.5 md:pt-2 pb-3 md:pb-4 px-1.5 md:px-2 bg-white/[0.01] border border-white/[0.05] rounded-xl">
                    <div className="flex justify-between text-[9px] md:text-[10px] text-white/20 mb-2 md:mb-3 font-mono tracking-widest uppercase">
                      <span>{q.min || 0}</span>
                      <span className="text-primary-400 font-semibold text-[10px] md:text-[11px]">{formData[q.id] || (q.min || 0)}</span>
                      <span>{q.max || 100}</span>
                    </div>
                    <input
                      type="range"
                      disabled={isSubmitted}
                      min={q.min || 0}
                      max={q.max || 100}
                      value={formData[q.id] || (q.min || 0)}
                      onChange={(e) => handleChange(q.id, Number(e.target.value))}
                      className="w-full h-1 md:h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary-500 hover:accent-primary-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {!isSubmitted && (
          <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: questions.length * 0.1, duration: 0.5 }}
            className="mt-6 md:mt-8"
          >
            <LoadingButton
              onClick={handleSubmit}
              loading={isSubmitting}
              loadingText="Transmitting..."
              className="w-full"
              icon={<ArrowUpRight size={16} />}
            >
              Submit Responses
            </LoadingButton>
          </motion.div>
        )}
        
        {isSubmitted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-5 md:mt-6 pt-3 md:pt-4 border-t border-white/[0.08] flex items-center justify-between text-[9px] md:text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium"
          >
            <span>Transmission Sent</span>
            <span className="text-primary-400/80 flex items-center gap-1.5"><Check size={10} strokeWidth={3} /> Logged</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
