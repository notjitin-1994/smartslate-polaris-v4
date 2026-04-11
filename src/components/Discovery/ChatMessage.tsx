'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Sparkles } from 'lucide-react';
import { UIMessage } from 'ai';
import { ApprovalCard } from './ApprovalCard';

interface ChatMessageProps {
  message: UIMessage;
  approveStage: (id: string) => void;
  rejectStage: (id: string, feedback: string) => void;
  submitToolResult: (toolName: string, toolCallId: string, result: any) => void;
}

export function ChatMessage({ message, approveStage, rejectStage, submitToolResult }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-4 w-full ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-secondary-500 text-[#020C1B] shadow-[0_0_15px_rgba(79,70,229,0.3)]'
            : 'bg-primary-500/10 text-primary-500 border border-primary-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(167,218,219,0.1)]'
        }`}
      >
        {isUser ? <User size={16} strokeWidth={2.5} /> : <Bot size={16} strokeWidth={2.5} />}
      </div>

      {/* Message Content */}
      <div className={`max-w-[85%] space-y-3 ${isUser ? 'items-end' : ''}`}>
        {message.parts?.map((part, i) => {
          if (part.type === 'text') {
            return (
              <div
                key={i}
                className={`p-5 rounded-2xl text-sm leading-relaxed overflow-hidden ${
                  isUser
                    ? 'bg-gradient-to-br from-secondary-500/20 to-secondary-500/5 border border-secondary-500/20 text-white backdrop-blur-xl rounded-tr-sm'
                    : 'bg-white/[0.03] border border-white/10 text-white/90 backdrop-blur-xl rounded-tl-sm shadow-xl'
                }`}
              >
                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-headings:font-heading prose-headings:text-white prose-a:text-primary-400 hover:prose-a:text-primary-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {part.text}
                  </ReactMarkdown>
                </div>
              </div>
            );
          }

          if (part.type === 'tool-requestApproval' || (part.type === 'dynamic-tool' && part.toolName === 'requestApproval')) {
            const input = part.input as Record<string, unknown>;
            return (
              <ApprovalCard
                key={part.toolCallId}
                summary={(input?.summary as string) ?? ''}
                nextStage={(input?.nextStage as string) ?? ''}
                state={part.state}
                onApprove={() => approveStage(part.toolCallId)}
                onReject={(feedback: string) => rejectStage(part.toolCallId, feedback)}
              />
            );
          }

          if (part.type === 'tool-setProjectParameters' || (part.type === 'dynamic-tool' && part.toolName === 'setProjectParameters')) {
            const input = part.input as { parameterName: string; min: number; max: number; unit: string; currentValue?: number };
            const toolCallId = part.toolCallId;

            return (
              <div key={toolCallId} className="glass-card p-6 rounded-2xl border-primary-500/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Set {input.parameterName}</h3>
                </div>
                
                {part.state === 'output-available' ? (
                  <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-500 text-xs font-bold">
                    Value set to: {(part as any).output?.value} {input.unit}
                  </div>
                ) : (
                  <div className="space-y-6 pt-4">
                    <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase">
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
                    <p className="text-[10px] text-white/30 italic text-center">Adjust slider to confirm value</p>
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
