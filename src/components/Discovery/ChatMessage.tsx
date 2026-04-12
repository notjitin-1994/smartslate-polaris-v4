'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { UIMessage } from 'ai';
import { ApprovalCard } from './ApprovalCard';
import { InteractiveFormCard } from './InteractiveFormCard';
import { StreamingMarkdown } from './StreamingMarkdown';

interface ChatMessageProps {
  message: UIMessage;
  approveStage: (id: string) => void;
  rejectStage: (id: string, feedback: string) => void;
  submitToolResult: (toolName: string, toolCallId: string, result: any) => void;
  isLast?: boolean;
  isChatLoading?: boolean;
}

export const ChatMessage = memo(function ChatMessage({ message, approveStage, rejectStage, submitToolResult, isLast, isChatLoading }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isStreaming = !isUser && isLast && isChatLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 w-full ${isUser ? 'flex-row-reverse' : ''} group`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/[0.08] ${isUser ? 'bg-white/10' : 'bg-transparent'}`}>
        {isUser ? <User size={14} /> : <img src="/logo-swirl.png" className="w-5 h-5 opacity-80" />}
      </div>

      <div className={`max-w-[85%] space-y-2 ${isUser ? 'items-end' : ''}`}>
        {message.parts.map((part, i) => {
          if (part.type === 'text') {
            return (
              <div key={i} className={`py-3 px-5 rounded-2xl text-[13px] leading-relaxed ${isUser ? 'bg-white/10 text-white rounded-tr-none' : 'text-white/80'}`}>
                <StreamingMarkdown content={part.text} isStreaming={isStreaming} />
              </div>
            );
          }

          if (part.type === 'tool-invocation') {
            const { toolName, toolCallId, state, args, result } = part as any;
            
            if (toolName === 'askInteractiveQuestions') {
              return (
                <InteractiveFormCard
                  key={toolCallId}
                  toolCallId={toolCallId}
                  questions={args.questions || []}
                  isSubmitted={state === 'result' || !!result}
                  initialData={result || {}}
                  onSubmit={(data) => submitToolResult('askInteractiveQuestions', toolCallId, data)}
                />
              );
            }

            if (toolName === 'requestApproval') {
              return (
                <ApprovalCard
                  key={toolCallId}
                  stageNumber={args.stageNumber}
                  stageName={args.stageName}
                  keyFindings={args.keyFindings}
                  insight={args.insight}
                  nextStage={args.nextStage}
                  state={state as any}
                  onApprove={() => approveStage(toolCallId)}
                  onReject={(fb) => rejectStage(toolCallId, fb)}
                />
              );
            }
          }
          return null;
        })}
      </div>
    </motion.div>
  );
});
