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
    <div className="glass-card p-1 rounded-3xl border border-white/10 bg-[#0d1b2a]/55 backdrop-blur-[18px] shadow-[0_8px_40px_rgba(0,0,0,0.4)] w-full max-w-2xl relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="p-5 relative z-10">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-500/5 border border-primary-500/20 flex items-center justify-center text-primary-500 shadow-[0_0_15px_rgba(167,218,219,0.1)]">
            <Sparkles size={16} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-[13px] font-heading font-bold text-white/90 tracking-wide">Information Request</h3>
            <p className="text-[10px] text-white/40 font-light">Please provide details to proceed.</p>
          </div>
        </div>

        <div className="space-y-5">
          {questions.map((q, idx) => (
            <motion.div 
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex flex-col space-y-1.5"
            >
              <label className="text-[11px] font-bold text-white/80 flex items-center justify-between">
                <span>{q.label} {q.required && <span className="text-primary-500/70 ml-0.5">*</span>}</span>
                {isSubmitted && formData[q.id] && (
                  <Check size={10} className="text-primary-500" />
                )}
              </label>
              
              {q.description && (
                <p className="text-[9px] text-white/30 leading-relaxed mb-0.5">{q.description}</p>
              )}

              <div className="relative group">
                {q.type === 'text' && (
                  <input
                    type="text"
                    disabled={isSubmitted}
                    value={formData[q.id] || ''}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    className="w-full bg-black/15 border-b border-white/5 px-3.5 py-2.5 rounded-t-lg text-xs text-white placeholder-white/15 focus:outline-none focus:border-primary-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    placeholder="Type your answer..."
                  />
                )}

                {q.type === 'textarea' && (
                  <textarea
                    disabled={isSubmitted}
                    value={formData[q.id] || ''}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    rows={2}
                    className="w-full bg-black/15 border-b border-white/5 px-3.5 py-2.5 rounded-t-lg text-xs text-white placeholder-white/15 focus:outline-none focus:border-primary-500/50 transition-all resize-none disabled:opacity-40 disabled:cursor-not-allowed"
                    placeholder="Provide details..."
                  />
                )}

                {q.type === 'select' && (
                  <div className="relative">
                    <select
                      disabled={isSubmitted}
                      value={formData[q.id] || ''}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      className="w-full bg-black/15 border-b border-white/5 px-3.5 py-2.5 rounded-t-lg text-xs text-white focus:outline-none focus:border-primary-500/50 transition-all appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled className="bg-[#020C1B] text-white/40">Select an option...</option>
                      {q.options?.map(opt => (
                        <option key={opt} value={opt} className="bg-[#020C1B] text-white">{opt}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                  </div>
                )}

                {q.type === 'date' && (
                  <div className="relative">
                    <input
                      type="date"
                      disabled={isSubmitted}
                      value={formData[q.id] || ''}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      className="w-full bg-black/15 border-b border-white/5 px-3.5 py-2.5 rounded-t-lg text-xs text-white placeholder-white/15 focus:outline-none focus:border-primary-500/50 transition-all [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <CalendarIcon size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                  </div>
                )}

                {q.type === 'slider' && (
                  <div className="pt-1.5 pb-3 px-1">
                    <div className="flex justify-between text-[9px] text-white/20 mb-2 font-mono">
                      <span>{q.min || 0}</span>
                      <span className="text-primary-400/80 font-bold text-[10px]">{formData[q.id] || (q.min || 0)}</span>
                      <span>{q.max || 100}</span>
                    </div>
                    <input
                      type="range"
                      disabled={isSubmitted}
                      min={q.min || 0}
                      max={q.max || 100}
                      value={formData[q.id] || (q.min || 0)}
                      onChange={(e) => handleChange(q.id, Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary-500/70 disabled:opacity-30 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
                
                {/* Focus indicator line */}
                {!isSubmitted && (
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500/50 transition-all duration-300 group-focus-within:w-full" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {!isSubmitted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex justify-end"
          >
            <button
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-white/[0.08] border border-white/10 text-white/90 text-[11px] font-bold tracking-wider hover:bg-primary-500 hover:text-[#020C1B] hover:border-primary-500 transition-all active:scale-95 flex items-center gap-2 group"
            >
              Submit Responses
              <Check size={12} strokeWidth={3} className="text-primary-500 group-hover:text-[#020C1B] transition-colors" />
            </button>
          </motion.div>
        )}
        
        {isSubmitted && (
          <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] text-white/20 uppercase tracking-[0.2em] font-bold">
            <span>Transmission Sent</span>
            <span className="text-primary-500/60 flex items-center gap-1"><Check size={9} /> Logged</span>
          </div>
        )}
      </div>
    </div>
  );
}
