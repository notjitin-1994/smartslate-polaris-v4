'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';

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

  useEffect(() => {
    onUpdate(toolCallId, formData);
  }, [formData, toolCallId]); // Removed onUpdate from dependency array to prevent infinite loops

  const handleChange = (id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  // Glassmorphic high-tech styling
  return (
    <motion.div layout className="glass-card p-[2px] rounded-[24px] border border-white/[0.08] bg-[#020611]/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full max-w-2xl relative overflow-hidden group">
      {/* Decorative gradient orb */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary-500/10 rounded-full blur-[60px] pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-secondary-500/10 rounded-full blur-[60px] pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />

      <div className="p-6 relative z-10 bg-[#020611]/40 rounded-[22px] h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-primary-400 shadow-[0_0_20px_rgba(167,218,219,0.05)]">
            <Sparkles size={16} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-[14px] font-heading font-semibold text-white/95 tracking-wide">Information Request</h3>
            <p className="text-[11px] text-white/40 font-light tracking-wide mt-0.5">Please provide details to proceed</p>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <motion.div 
              layout
              key={q.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col space-y-2 relative"
            >
              <label className="text-[12px] font-medium text-white/80 flex items-center justify-between tracking-wide">
                <span>{q.label} {q.required && <span className="text-primary-500/70 ml-1 font-bold">*</span>}</span>
                {isSubmitted && formData[q.id] && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-primary-500/20 p-1 rounded-full">
                    <Check size={10} className="text-primary-400" />
                  </motion.div>
                )}
              </label>
              
              {q.description && (
                <p className="text-[10px] text-white/30 leading-relaxed font-light">{q.description}</p>
              )}

              <div className="relative group/input mt-1">
                {q.type === 'text' && (
                  <input
                    type="text"
                    disabled={isSubmitted}
                    value={formData[q.id] || ''}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.08] px-4 py-3 rounded-xl text-[13px] text-white/90 placeholder-white/20 focus:outline-none focus:border-primary-500/50 focus:bg-white/[0.04] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed font-light tracking-wide shadow-inner"
                    placeholder="Type your answer..."
                  />
                )}

                {q.type === 'textarea' && (
                  <textarea
                    disabled={isSubmitted}
                    value={formData[q.id] || ''}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    rows={3}
                    className="w-full bg-white/[0.02] border border-white/[0.08] px-4 py-3 rounded-xl text-[13px] text-white/90 placeholder-white/20 focus:outline-none focus:border-primary-500/50 focus:bg-white/[0.04] transition-all duration-300 resize-none disabled:opacity-40 disabled:cursor-not-allowed font-light tracking-wide shadow-inner"
                    placeholder="Provide details..."
                  />
                )}

                {q.type === 'select' && (
                  <div className="relative">
                    <select
                      disabled={isSubmitted}
                      value={formData[q.id] || ''}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/[0.08] px-4 py-3 rounded-xl text-[13px] text-white/90 focus:outline-none focus:border-primary-500/50 focus:bg-white/[0.04] transition-all duration-300 appearance-none disabled:opacity-40 disabled:cursor-not-allowed font-light tracking-wide shadow-inner"
                    >
                      <option value="" disabled className="bg-[#020C1B] text-white/40">Select an option...</option>
                      {q.options?.map(opt => (
                        <option key={opt} value={opt} className="bg-[#020C1B] text-white/90">{opt}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none transition-transform duration-300 group-focus-within/input:text-primary-500" />
                  </div>
                )}

                {q.type === 'date' && (
                  <div className="relative">
                    <input
                      type="date"
                      disabled={isSubmitted}
                      value={formData[q.id] || ''}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/[0.08] px-4 py-3 rounded-xl text-[13px] text-white/90 placeholder-white/20 focus:outline-none focus:border-primary-500/50 focus:bg-white/[0.04] transition-all duration-300 [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed font-light tracking-wide shadow-inner"
                    />
                    <CalendarIcon size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none transition-colors duration-300 group-focus-within/input:text-primary-500" />
                  </div>
                )}

                {q.type === 'slider' && (
                  <div className="pt-2 pb-4 px-2 bg-white/[0.01] border border-white/[0.05] rounded-xl">
                    <div className="flex justify-between text-[10px] text-white/30 mb-3 font-mono tracking-widest uppercase">
                      <span>{q.min || 0}</span>
                      <span className="text-primary-400 font-semibold text-[11px]">{formData[q.id] || (q.min || 0)}</span>
                      <span>{q.max || 100}</span>
                    </div>
                    <input
                      type="range"
                      disabled={isSubmitted}
                      min={q.min || 0}
                      max={q.max || 100}
                      value={formData[q.id] || (q.min || 0)}
                      onChange={(e) => handleChange(q.id, Number(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary-500 hover:accent-primary-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
            className="mt-8 flex justify-end"
          >
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-full bg-white text-[#020611] text-[12px] font-semibold tracking-wide hover:bg-primary-100 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all duration-300 active:scale-95 flex items-center gap-2 group/btn"
            >
              Submit Responses
              <Check size={14} strokeWidth={2.5} className="text-[#020611]/50 group-hover/btn:text-[#020611] transition-colors" />
            </button>
          </motion.div>
        )}
        
        {isSubmitted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium"
          >
            <span>Transmission Sent</span>
            <span className="text-primary-400/80 flex items-center gap-1.5"><Check size={10} strokeWidth={3} /> Logged</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
