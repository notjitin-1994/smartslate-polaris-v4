'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Sparkles } from 'lucide-react';
import { UIMessage } from 'ai';
import { ApprovalCard } from './ApprovalCard';
import { InteractiveFormCard, InteractiveQuestion } from './InteractiveFormCard';

interface ChatMessageProps {
  message: UIMessage;
  approveStage: (id: string) => void;
  rejectStage: (id: string, feedback: string) => void;
  submitToolResult: (toolName: string, toolCallId: string, result: any) => void;
  onFormUpdate?: (toolCallId: string, data: Record<string, any>) => void;
}

export function ChatMessage({ message, approveStage, rejectStage, submitToolResult, onFormUpdate }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3 w-full ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${
          isUser
            ? 'bg-secondary-500 text-[#020C1B] shadow-[0_0_15px_rgba(79,70,229,0.2)]'
            : 'bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.05)]'
        }`}
      >
        {isUser ? (
          <User size={14} strokeWidth={2.5} />
        ) : (
          <img src="/logo-swirl.png" alt="Polaris" className="w-5 h-5 opacity-90" />
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[85%] space-y-1.5 ${isUser ? 'items-end' : ''}`}>
        {message.parts?.map((part, i) => {
          if (part.type === 'text') {
            return (
              <div
                key={i}
                className={`p-3.5 rounded-2xl text-[12.5px] leading-relaxed overflow-hidden ${
                  isUser
                    ? 'bg-gradient-to-br from-secondary-500/15 to-secondary-500/5 border border-secondary-500/10 text-white/90 backdrop-blur-xl rounded-tr-sm'
                    : 'bg-white/[0.02] border border-white/5 text-white/80 backdrop-blur-xl rounded-tl-sm shadow-2xl'
                }`}
              >
                <div className="prose prose-invert prose-xs max-w-none prose-p:leading-relaxed prose-pre:bg-black/20 prose-pre:border prose-pre:border-white/5 prose-headings:font-heading prose-headings:text-white/90 prose-a:text-primary-400 hover:prose-a:text-primary-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {part.text}
                  </ReactMarkdown>
                </div>
              </div>
            );
          }

          if (part.type === 'tool-requestApproval' || (part.type === 'dynamic-tool' && part.toolName === 'requestApproval')) {
            const input = part.input as any;
            return (
              <ApprovalCard
                key={part.toolCallId}
                summary={input?.summary ?? ''}
                nextStage={input?.nextStage ?? ''}
                state={part.state}
                onApprove={() => approveStage(part.toolCallId)}
                onReject={(feedback: string) => rejectStage(part.toolCallId, feedback)}
              />
            );
          }

          if (part.type === 'tool-askInteractiveQuestions' || (part.type === 'dynamic-tool' && part.toolName === 'askInteractiveQuestions')) {
            const input = part.input as any;
            const toolCallId = part.toolCallId;
            const isSubmitted = part.state === 'output-available';

            if (!input?.questions) return null;

            return (
              <InteractiveFormCard
                key={toolCallId}
                toolCallId={toolCallId}
                questions={input.questions}
                isSubmitted={isSubmitted}
                initialData={isSubmitted ? (part as any).output?.data : {}}
                onSubmit={(data) => submitToolResult('askInteractiveQuestions', toolCallId, { status: 'submitted_via_form', data })}
                onUpdate={(id, data) => onFormUpdate && onFormUpdate(id, data)}
              />
            );
          }

          if (part.type === 'tool-setProjectParameters' || (part.type === 'dynamic-tool' && part.toolName === 'setProjectParameters')) {
            const input = part.input as any;
            const toolCallId = part.toolCallId;

            if (!input) return null;

            return (
              <div key={toolCallId} className="glass-card p-5 rounded-2xl border-white/10 space-y-3 bg-white/[0.01]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Set {input.parameterName}</h3>
                </div>
                
                {part.state === 'output-available' ? (
                  <div className="p-2.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-500 text-[9.5px] font-bold">
                    Value set to: {(part as any).output?.value} {input.unit}
                  </div>
                ) : (
                  <div className="space-y-3.5 pt-1.5">
                    <div className="flex justify-between text-[8.5px] font-bold text-white/25 uppercase">
                      <span>{input.min} {input.unit}</span>
                      <span>{input.max} {input.unit}</span>
                    </div>
                    <input 
                      type="range" 
                      min={input.min} 
                      max={input.max} 
                      defaultValue={input.currentValue || (input.max + input.min) / 2}
                      className="w-full accent-primary-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      onMouseUp={(e) => {
                        const val = parseInt((e.target as HTMLInputElement).value);
                        submitToolResult(
                          'setProjectParameters',
                          toolCallId,
                          { value: val, success: true }
                        );
                      }}
                    />
                    <p className="text-[8.5px] text-white/15 italic text-center">Adjust slider to confirm</p>
                  </div>
                )}
              </div>
            );
          }
          
          return null;
        })}
      </div>
    </motion.div>
  );
}
