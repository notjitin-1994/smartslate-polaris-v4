'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';
import { UIMessage } from 'ai';
import { ApprovalCard } from './ApprovalCard';
import { InteractiveFormCard } from './InteractiveFormCard';
import { StreamingMarkdown } from './StreamingMarkdown';
import { LoadingButton } from '../UI/LoadingButton';
import { getToolInfo } from '@/lib/utils/tool-parts';

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

  // Filter parts to prevent duplication (especially tool-results that might be double-persisted)
  const renderedParts = useMemo(() => {
    if (!message.parts) return [];
    
    const seenToolCalls = new Set<string>();
    return message.parts.filter(part => {
      const toolCallId = (part as any).toolCallId;
      if (toolCallId) {
        if (part.type === 'tool-result') {
          // Always keep results, but they might supersede an invocation in the same message
          return true;
        }
        if (seenToolCalls.has(toolCallId)) return false;
        seenToolCalls.add(toolCallId);
      }
      return true;
    });
  }, [message.parts]);

  // Helper to remove internal semantic envelopes from the visible UI
  const cleanText = (text: string) => {
    return text
      .replace(/\[FORM_SUBMISSION.*?\][\s\S]*?\[\/FORM_SUBMISSION\]/g, '')
      .replace(/\[TOOL_RESULT.*?\][\s\S]*?\[\/TOOL_RESULT\]/g, '')
      .trim();
  };

  return (
    <motion.div
      layout={isStreaming ? false : "position"}
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
        {renderedParts.map((part, i) => {
          if (part.type === 'text') {
            const cleaned = cleanText(part.text);
            
            // Fix: Don't render empty text bubbles (happens when AI only sends tool calls)
            if (!cleaned) return null;

            return (
              <motion.div
                layout={isStreaming ? false : "position"}
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

          const toolInfo = getToolInfo(part);
          if (!toolInfo) return null;

          const toolCallId = (part as any).toolCallId;
          const input = (part as any).args || (part as any).input;
          const output = (part as any).result || (part as any).output;
          const isSubmitted = toolInfo.state === 'result' || toolInfo.state === 'output-available';

          if (toolInfo.toolName === 'requestApproval') {
            return (
              <ApprovalCard
                key={toolCallId}
                stageNumber={input?.stageNumber ?? 1}
                stageName={input?.stageName ?? ''}
                keyFindings={input?.keyFindings ?? []}
                insight={input?.insight ?? ''}
                nextStage={input?.nextStage ?? ''}
                state={toolInfo.state as any}
                onApprove={() => approveStage(toolCallId)}
                onReject={(feedback: string) => rejectStage(toolCallId, feedback)}
              />
            );
          }

          if (toolInfo.toolName === 'askInteractiveQuestions') {
            // Show a skeleton or loading state if the tool is streaming and questions aren't fully parsed yet
            if (!input?.questions && toolInfo.state === 'input-streaming') {
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
                initialData={output || {}}
                onSubmit={(data) => submitToolResult('askInteractiveQuestions', toolCallId, data)}
                onUpdate={(id, data) => onFormUpdate && onFormUpdate(id, data)}
              />
            );
          }

          if (toolInfo.toolName === 'setProjectParameters') {
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
                    Value set to: {output?.value || input.currentValue} {input.unit}
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
                    />
                    <LoadingButton 
                      variant="primary"
                      className="w-full mt-2"
                      onClick={(e) => {
                        const slider = e.currentTarget.parentElement?.querySelector('input[type="range"]') as HTMLInputElement;
                        const val = parseInt(slider.value);
                        submitToolResult(
                          'setProjectParameters',
                          toolCallId,
                          { value: val, success: true }
                        );
                      }}
                    >
                      Confirm Parameters
                    </LoadingButton>
                    <p className="text-[9px] text-white/20 italic text-center font-light">Adjust slider and confirm</p>
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
