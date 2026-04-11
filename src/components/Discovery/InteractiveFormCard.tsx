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

      <div className="p-6 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-500/5 border border-primary-500/20 flex items-center justify-center text-primary-500 shadow-[0_0_15px_rgba(167,218,219,0.15)]">
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-heading font-bold text-white tracking-wide">Information Request</h3>
            <p className="text-[11px] text-white/50 font-light">Please provide the following details to proceed.</p>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <motion.div 
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col space-y-2"
            >
              <label className="text-xs font-bold text-white/90 flex items-center justify-between">
                <span>{q.label} {q.required && <span className="text-primary-500 ml-1">*</span>}</span>
                {isSubmitted && formData[q.id] && (
                  <Check size={12} className="text-primary-500" />
                )}
              </label>
              
              {q.description && (
                <p className="text-[10px] text-white/40 leading-relaxed mb-1">{q.description}</p>
              )}

              <div className="relative group">
                {q.type === 'text' && (
                  <input
                    type="text"
                    disabled={isSubmitted}
                    value={formData[q.id] || ''}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    className="w-full bg-black/20 border-b-2 border-white/10 px-4 py-3 rounded-t-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Type your answer..."
                  />
                )}

                {q.type === 'textarea' && (
                  <textarea
                    disabled={isSubmitted}
                    value={formData[q.id] || ''}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    rows={3}
                    className="w-full bg-black/20 border-b-2 border-white/10 px-4 py-3 rounded-t-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary-500 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Provide details..."
                  />
                )}

                {q.type === 'select' && (
                  <div className="relative">
                    <select
                      disabled={isSubmitted}
                      value={formData[q.id] || ''}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      className="w-full bg-black/20 border-b-2 border-white/10 px-4 py-3 rounded-t-lg text-sm text-white focus:outline-none focus:border-primary-500 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled className="bg-[#020C1B] text-white/50">Select an option...</option>
                      {q.options?.map(opt => (
                        <option key={opt} value={opt} className="bg-[#020C1B] text-white">{opt}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                )}

                {q.type === 'date' && (
                  <div className="relative">
                    <input
                      type="date"
                      disabled={isSubmitted}
                      value={formData[q.id] || ''}
                      onChange={(e) => handleChange(q.id, e.target.value)}
                      className="w-full bg-black/20 border-b-2 border-white/10 px-4 py-3 rounded-t-lg text-sm text-white placeholder-white/20 focus:outline-none focus:border-primary-500 transition-all [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <CalendarIcon size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                )}

                {q.type === 'slider' && (
                  <div className="pt-2 pb-4 px-2">
                    <div className="flex justify-between text-[10px] text-white/30 mb-3 font-mono">
                      <span>{q.min || 0}</span>
                      <span className="text-primary-400 font-bold text-xs">{formData[q.id] || (q.min || 0)}</span>
                      <span>{q.max || 100}</span>
                    </div>
                    <input
                      type="range"
                      disabled={isSubmitted}
                      min={q.min || 0}
                      max={q.max || 100}
                      value={formData[q.id] || (q.min || 0)}
                      onChange={(e) => handleChange(q.id, Number(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
                
                {/* Focus indicator line */}
                {!isSubmitted && (
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 transition-all duration-300 group-focus-within:w-full" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {!isSubmitted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex justify-end"
          >
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-primary-500 text-[#020C1B] text-sm font-bold tracking-wide hover:bg-primary-400 hover:shadow-[0_0_20px_rgba(167,218,219,0.4)] transition-all active:scale-95 flex items-center gap-2"
            >
              Submit Responses
              <Check size={16} strokeWidth={3} />
            </button>
          </motion.div>
        )}
        
        {isSubmitted && (
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30 uppercase tracking-widest font-bold">
            <span>Status:</span>
            <span className="text-primary-500 flex items-center gap-1"><Check size={10} /> Submitted</span>
          </div>
        )}
      </div>
    </div>
  );
}
