'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Sparkles } from 'lucide-react';
import { UIMessage } from 'ai';
import { ApprovalCard } from './ApprovalCard';
import { InteractiveFormCard, InteractiveQuestion } from './InteractiveFormCard';
import { StreamingMarkdown } from './StreamingMarkdown';

interface ChatMessageProps {
  message: UIMessage;
  approveStage: (id: string) => void;
  rejectStage: (id: string, feedback: string) => void;
  submitToolResult: (toolName: string, toolCallId: string, result: any) => void;
  onFormUpdate?: (toolCallId: string, data: Record<string, any>) => void;
  isLast?: boolean;
  isChatLoading?: boolean;
}

export function ChatMessage({ message, approveStage, rejectStage, submitToolResult, onFormUpdate, isLast, isChatLoading }: ChatMessageProps) {
  const isUser = message.role === 'user';
  // Stable streaming check: only stream the last assistant message if the chat is actively processing
  const isStreaming = !isUser && isLast && isChatLoading;

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
            
            // Fix: Don't render empty text bubbles (happens when AI only sends tool calls)
            if (!cleaned) return null;

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
                <StreamingMarkdown content={cleaned} isStreaming={isStreaming} />
              </motion.div>
            );
          }

          if (part.type === 'tool-requestApproval' || (part.type as any) === 'tool-invocation' && (part as any).toolName === 'requestApproval' || part.type === 'dynamic-tool' && part.toolName === 'requestApproval') {
            const input = (part as any).args || (part as any).input;
            return (
              <ApprovalCard
                key={(part as any).toolCallId}
                stageNumber={input?.stageNumber ?? 1}
                stageName={input?.stageName ?? ''}
                keyFindings={input?.keyFindings ?? []}
                insight={input?.insight ?? ''}
                nextStage={input?.nextStage ?? ''}
                state={(part as any).state}
                onApprove={() => approveStage((part as any).toolCallId)}
                onReject={(feedback: string) => rejectStage((part as any).toolCallId, feedback)}
              />
            );
          }

          if (part.type === 'tool-askInteractiveQuestions' || (part.type as any) === 'tool-invocation' && (part as any).toolName === 'askInteractiveQuestions' || part.type === 'dynamic-tool' && part.toolName === 'askInteractiveQuestions') {
            const input = (part as any).args || (part as any).input;
            const toolCallId = (part as any).toolCallId;
            const state = (part as any).state;
            const isSubmitted = state === 'result' || state === 'output-available';

            // Show a skeleton or loading state if the tool is streaming and questions aren't fully parsed yet
            if (!input?.questions && state === 'input-streaming') {
              return (
                <div key={toolCallId} className="p-5 md:p-6 bg-[#020611]/40 border border-white/[0.08] rounded-[22.5px] md:rounded-[31px] my-2 md:my-4 max-w-2xl w-full animate-pulse">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 rounded-full bg-white/5" />
                     <div className="space-y-2">
                       <div className="h-3 w-32 bg-white/5 rounded" />
                       <div className="h-2 w-48 bg-white/5 rounded" />
                     </div>
                   </div>
                   <div className="space-y-4">
                     <div className="h-10 bg-white/5 rounded-xl" />
                     <div className="h-10 bg-white/5 rounded-xl" />
                   </div>
                </div>
              );
            }

            if (!input?.questions) return null;

            return (
              <InteractiveFormCard
                key={toolCallId}
                toolCallId={toolCallId}
                questions={input.questions}
                isSubmitted={isSubmitted}
                initialData={isSubmitted ? (part as any).result?.data || (part as any).output?.data : {}}
                onSubmit={(data) => submitToolResult('askInteractiveQuestions', toolCallId, { status: 'submitted_via_form', data })}
                onUpdate={(id, data) => onFormUpdate && onFormUpdate(id, data)}
              />
            );
          }

          if (part.type === 'tool-setProjectParameters' || (part.type as any) === 'tool-invocation' && (part as any).toolName === 'setProjectParameters' || part.type === 'dynamic-tool' && part.toolName === 'setProjectParameters') {
            const input = (part as any).args || (part as any).input;
            const toolCallId = (part as any).toolCallId;
            const state = (part as any).state;
            const isSubmitted = state === 'result' || state === 'output-available';

            if (!input) return null;

            return (
              <motion.div layout key={toolCallId} className="glass-card p-5 rounded-[20px] border border-white/5 space-y-4 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500 border border-primary-500/20">
                    <Sparkles size={14} />
                  </div>
                  <h3 className="text-[11px] font-semibold text-white/80 uppercase tracking-widest">Set {input.parameterName}</h3>
                </div>
                
                {isSubmitted ? (
                  <div className="p-3 rounded-xl bg-primary-500/5 border border-primary-500/10 text-primary-400 text-[11px] font-medium tracking-wide">
                    Value set to: {(part as any).result?.value || (part as any).output?.value} {input.unit}
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
