'use client';

import { Check, X, AlertCircle } from 'lucide-react';

interface ApprovalCardProps {
  summary: string;
  nextStage: string;
  onApprove: () => void;
  onReject: (feedback: string) => void;
}

export function ApprovalCard({ summary, nextStage, onApprove, onReject }: ApprovalCardProps) {
  return (
    <div className="glass-card p-5 rounded-2xl border-primary-500/30 bg-primary-500/5 my-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2 text-primary-500 mb-3">
        <AlertCircle size={18} />
        <span className="text-sm font-bold uppercase tracking-wider">Approval Required</span>
      </div>
      
      <p className="text-sm text-white/80 leading-relaxed mb-4">
        {summary}
      </p>
      
      <div className="flex flex-col gap-3">
        <div className="text-xs text-muted-foreground uppercase tracking-widest">
          Transitioning to: <span className="text-white">{nextStage}</span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={onApprove}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary-500 text-brand-bg text-sm font-bold hover:bg-primary-400 transition"
          >
            <Check size={16} />
            Approve & Continue
          </button>
          
          <button 
            onClick={() => onReject("I need more detail on...")}
            className="px-4 flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5 transition text-white/60"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
