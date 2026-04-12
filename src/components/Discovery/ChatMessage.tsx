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

  // Helper to remove internal semantic envelopes from the visible UI
  const cleanText = (text: string) => {
    return text
      .replace(/\[FORM_SUBMISSION.*?\][\s\S]*?\[\/FORM_SUBMISSION\]/g, '')
      .replace(/\[TOOL_RESULT.*?\][\s\S]*?\[\/TOOL_RESULT\]/g, '')
      .trim();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={`flex gap-4 w-full ${isUser ? 'flex-row-reverse' : ''} group`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden transition-all duration-500 ${
          isUser
            ? 'bg-white/10 text-white/70 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
            : 'bg-transparent border border-white/[0.08] shadow-[0_0_20px_rgba(167,218,219,0.05)]'
        }`}
      >
        {isUser ? (
          <User size={14} strokeWidth={2} />
        ) : (
          <img src="/logo-swirl.png" alt="Polaris" className="w-5 h-5 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 drop-shadow-[0_0_8px_rgba(167,218,219,0.5)]" />
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[82%] space-y-2 ${isUser ? 'items-end' : ''}`}>
        {message.parts?.map((part, i) => {
          if (part.type === 'text') {
            const cleaned = cleanText(part.text);
            if (!cleaned && isUser) return null; // Don't render empty user bubbles

            return (
              <motion.div
                layout
                key={i}
                className={`py-3.5 px-5 rounded-[20px] text-[13px] leading-[1.7] overflow-hidden tracking-wide font-light ${
                  isUser
                    ? 'bg-white/10 border border-white/[0.05] text-white/95 rounded-tr-sm backdrop-blur-xl'
                    : 'bg-transparent text-white/80'
                }`}
              >
                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-[1.8] prose-p:mb-4 last:prose-p:mb-0 prose-pre:bg-white/[0.03] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl prose-headings:font-heading prose-headings:font-semibold prose-headings:text-white/90 prose-headings:tracking-wide prose-a:text-primary-400 hover:prose-a:text-primary-300 prose-strong:text-white/90 prose-strong:font-semibold">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {cleaned}
                  </ReactMarkdown>
                </div>
              </motion.div>
            );
          }

          if (part.type === 'tool-requestApproval' || (part.type === 'dynamic-tool' && part.toolName === 'requestApproval')) {
            const input = part.input as any;
            return (
              <ApprovalCard
                key={part.toolCallId}
                stageNumber={input?.stageNumber ?? 1}
                stageName={input?.stageName ?? ''}
                keyFindings={input?.keyFindings ?? []}
                insight={input?.insight ?? ''}
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
              <motion.div layout key={toolCallId} className="glass-card p-5 rounded-[20px] border border-white/5 space-y-4 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500 border border-primary-500/20">
                    <Sparkles size={14} />
                  </div>
                  <h3 className="text-[11px] font-semibold text-white/80 uppercase tracking-widest">Set {input.parameterName}</h3>
                </div>
                
                {part.state === 'output-available' ? (
                  <div className="p-3 rounded-xl bg-primary-500/5 border border-primary-500/10 text-primary-400 text-[11px] font-medium tracking-wide">
                    Value set to: {(part as any).output?.value} {input.unit}
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between text-[9px] font-semibold text-white/40 uppercase tracking-widest">
                      <span>{input.min} {input.unit}</span>
                      <span>{input.max} {input.unit}</span>
                    </div>
                    <input 
                      type="range" 
                      min={input.min} 
                      max={input.max} 
                      defaultValue={input.currentValue || (input.max + input.min) / 2}
                      className="w-full accent-primary-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer hover:accent-primary-400 transition-all"
                      onMouseUp={(e) => {
                        const val = parseInt((e.target as HTMLInputElement).value);
                        submitToolResult(
                          'setProjectParameters',
                          toolCallId,
                          { value: val, success: true }
                        );
                      }}
                    />
                    <p className="text-[9px] text-white/20 italic text-center font-light">Adjust slider to confirm</p>
                  </div>
                )}
              </motion.div>
            );
          }
          
          return null;
        })}
      </div>
    </motion.div>
  );
}
